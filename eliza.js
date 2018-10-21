// Suomenkielinen Eliza
// Copyright (C) 2018 Iikka Hauhio
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

var libvoikko = Libvoikko();
var voikko, script;

fetch("eliza.json").then(x => x.json()).then(s => {
	script = s;
	script.avainsanat["*"].__avainsana__ = "*";
});

// This function returns the response of Eliza given a message
function getResponse(message) {
	if (voikko === undefined) {
		voikko = libvoikko.init("fi");
	}

	return voikko.sentences(message).map(s => getResponseToSingleSentence(s.text)).join(" ");
}
function getResponseToSingleSentence(message) {
	var [keywords, cleanedMessage] = getKeywordsAndCleanedMessage(message);
	var matchingRules = Object.keys(script.avainsanat).filter(kw => keywords.includes(kw));
	if (matchingRules.length > 0) {
		var rules = matchingRules.map(kw => ({__avainsana__: kw, ...script.avainsanat[kw]})).sortBy(rule => -rule.__tärkeys__ || 0);
		for (var rule of rules) {
			var answer = evalRule(rule, cleanedMessage);
			if (answer !== null) {
				return answer;
			}
		}
	}
	else {
		return evalRule(script.avainsanat["*"], cleanedMessage);
	}
}

function getKeywordsAndCleanedMessage(message) {
	var keywords = [];
	var cleanedMessage = "";
	for (var token of voikko.tokens(message)) {
		if (token.type === "WORD") {
			var proper = false;
			for (var alt of voikko.analyze(token.text)) {
				var bf = alt.BASEFORM;
				if (bf.toLowerCase() !== bf) proper = true;
				keywords.push(bf);
				for (var syn in script.synonyymit) {
					if (script.synonyymit[syn].includes(bf)) {
						keywords.push(syn);
					}
				}
			}
			cleanedMessage += proper ? token.text : token.text.toLowerCase();
		}
		if (token.type === "WHITESPACE") {
			cleanedMessage += token.text;
		}
	}
	return [keywords, cleanedMessage];
}

function evalRule(rule, message) {
	for (var pattern of Object.keys(rule).sortBy(i => -(i.match(/\*/g) || []).length)) {
		var groups = matches(pattern, message);
		if (groups !== null) {
			var answer = rule[pattern][getCounter(rule, pattern)];
			for (var i = 0; i < groups.length; i++) {
				answer = answer.replace("(" + (i+1) + ")", reflect(groups[i]));
			}
			if (answer.startsWith("suorita ")) {
				return evalRule(script.avainsanat[answer.substring("suorita ".length)], message);
			}
			return answer;
		}
	}
	return null;
}

function matches(pattern, message) {
	patternTokens = pattern.split(" ");
	messageTokens = message.split(/\s+/);
	var alts = matchesHelper(patternTokens, messageTokens, 0, 0, [""]);
	if (alts.length === 0) {
		return null;
	} else {
		return alts[0]; // TODO pitäisikö arpoa joku?
	}
}

function matchesHelper(patternTokens, messageTokens, i, j, groups) {
	var ans = [];
	while (i <= patternTokens.length && j <= messageTokens.length) {
		var patternToken = i < patternTokens.length ? patternTokens[i] : "<END>";
		var messageToken = j < messageTokens.length ? messageTokens[j] : "<END>";
		
		var addGroup = false;
		if (patternToken.startsWith("@")) {
			patternToken = patternToken.substring(1);
			addGroup = true;
		}

		if (patternToken === "*") {
			ans = ans.concat(matchesHelper(patternTokens, messageTokens, i+1, j, groups.concat([""])));
			groups[groups.length-1] = (groups[groups.length-1] || "") + " " + messageToken; 
			j += 1;
		} else if (patternToken.split("|").some(pt => matchesToken(pt, messageToken))) {
			i += 1;
			j += 1;
			if (addGroup) {
				groups[groups.length-1] = messageToken;
				groups.push("");
			}
		} else {
			return ans;
		}
	}
	if (i < patternTokens.length || j < messageTokens.length) {
		return ans;
	}
	groups.length -= 1;
	return ans.concat([groups.map(str => str.trim())]);
}

function matchesToken(pattern, token) {
	if (pattern.endsWith("%")) {
		for (var alt of voikko.analyze(token)) {
			if (alt.BASEFORM === pattern.slice(0, -1)) {
				return true;
			}
		}
		return false;
	}
	return pattern.toLowerCase() === token.toLowerCase();
}

var counters = {};

function getCounter(rule, pattern) {
	var key = rule.__avainsana__ + "/" + pattern;
	var counter = counters[key] || 0;
	counters[key] = (counter + 1) % rule[pattern].length;
	return counter;
}

// Switches persons: minä -> sinä, sinä -> minä, te -> me (not currently me -> te)
function reflect(str) {
	if (voikko === undefined) {
		voikko = libvoikko.init("fi");
	}

	var ans = "";

	for (var token of voikko.tokens(str)) {
		if (token.type === "WORD") {
			ans += reflectWord(token.text);
		}
		else {
			ans += token.text;
		}
	}

	return ans;
}

function reflectWord(word) {
	var alts = [];
	for (var alt of voikko.analyze(word)) {
		var tmpWord = word;
		// Remove suffix particle
		if (alt.FOCUS) {
			var focus = tmpWord.slice(-alt.FOCUS.length);
			tmpWord = tmpWord.slice(0, -alt.FOCUS.length);
		}
		// Reverse persons
		if (alt.POSSESSIVE === "1s") {
			tmpWord = tmpWord.replaceLast(/ni/, "si");
		}
		if (alt.POSSESSIVE === "2s") {
			tmpWord = tmpWord.replaceLast(/si/, "ni");
		}
		if (alt.POSSESSIVE === "2p") {
			tmpWord = tmpWord.replaceLast(/nne/, "mme");
		}
		if (alt.MOOD === "indicative" || alt.MOOD == "conditional" || alt.MOOD == "potential") {
			if (alt.PERSON === "1" && alt.NUMBER === "singular") {
				tmpWord = tmpWord.replaceLast(/n/, "t");
			}
			if (alt.PERSON === "2" && alt.NUMBER === "singular") {
				tmpWord = tmpWord.replaceLast(/t/, "n");
			}
			if (alt.PERSON === "2" && alt.NUMBER === "plural") {
				tmpWord = tmpWord.replaceLast(/tte/, "mme");
			}
		}
		if (alt.BASEFORM == "minä") {
			tmpWord = "s" + tmpWord.substring(1);
		}
		if (alt.BASEFORM == "sinä") {
			tmpWord = "m" + tmpWord.substring(1);
		}
		if (alt.BASEFORM == "te") {
			tmpWord = "m" + tmpWord.substring(1);
		}
		// Add suffix particle
		if (alt.FOCUS) {
			tmpWord += focus;
		}
		alts.push(tmpWord);
	}
	if (alts.length === 0) {
		return word;
	}
	else {
		return alts[0]; // TODO valitse oikea vaihtoehto
	}
}

Array.prototype.sortBy = function(key) {
	return this.sort((a, b) => {
		var x = key(a);
		var y = key(b);
		if (x < y) return -1;
		if (x > y) return 1;
		return 0;
	});
}

String.prototype.replaceLast = function(regex, replacement) {
	var matches = this.match(regex) || [];
	if (matches.length == 0) return this;
	var lastMatch = matches[matches.length-1];
	var index = this.lastIndexOf(lastMatch);
	return this.substring(0, index) + replacement + this.substring(index + lastMatch.length);
}
