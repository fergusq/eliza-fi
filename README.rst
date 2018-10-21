======================
 Suomenkielinen Eliza
======================

Suomenkielinen versio kuuluisasta Eliza-ohjelmasta.

Riippuvuudet
============

Käännä libvoikko-kirjasto JavaScriptiksi `näiden ohjeiden <https://github.com/voikko/corevoikko/wiki/JavaScript>`_ avulla.
Tiedostot ``libvoikko.js`` ja ``libvoikko.data`` (sekä ``libvoikko.wasm`` jos käänsit WebAssemblyksi)
pitää sijoittaa samaan kansioon muiden tiedostojen kanssa.

Käsikirjoitukset
================

Tiedosto ``eliza.json`` sisältää käsikirjoituksen, jota ohjelma noudattaa.
Käsikirjoitusta noudatetaan seuraavasti:

1. Käyttäjä antaa syötteenä lauseen.
2. Lauseen sanajoukko muodostetaan perusmuotoistamalla sanat. Sanajoukkoon lisätään myös synonyymisääntöjen perusteella oikeat avainsanat.
3. Käydään läpi avainsanojen tärkeysjärjestyksessä sanoja vastaavat säännöt.
4. Jokaisen säännön kohdalla yritetään sovittaa säännön hahmoa syötteeseen.
5. Palautetaan ensimmäsen sopivan säännön seuraavana jonossa oleva vastaus.

Hahmonsovitus toimii sanekohtaisesti. Käytössä on seuraavat hahmot (missä ``sana`` on merkkijono ja ``a`` sekä ``b`` ovat hahmoja):

1. ``*`` täsmää mihin tahansa tyhjään tai ei-tyhjään joukkoon saneita.
2. ``sana`` täsmää kirjaimellisesti samaan merkkijonoon.
3. ``sana%`` täsmää kaikkiin saneisiin, joiden perusmuoto on "sana".
4. ``a|b`` täsmää joko a:han tai b:hen.
5. ``@a`` täsmää a:han.

Hahmonsovituksen lopputuloksena on lista syötteen alimerkkijonoja jokaista ``*``- ja ``@``-sääntöä kohden.

Heikkoudet
==========

Ohjelma ei tällä hetkellä sisällä kunnollista tekstin jäsentämistä,
joten sanojen perusmuotoistaminen on välillä melko satunnaista.
Ohjelma ei esimerkiksi luulee usein, että "minä" on mikä-sanan essiivi ja
"sinä" on se-sanan essiivi, vaikka sanat ovat useammin pronomineja.
Ratkaisu tähän olisi jäsentää teksti siten, että jokaista sanetta vastaava
lekseemi selviää oikein. En ole kuitenkaan löytänyt sopivaa JavaScriptillä
tehtyä kirjastoa tätä varten.

Vastausten laatiminen suomenkielisele Elizalle on haastavampaa kuin englanninkieliselle,
sillä käyttäjän antamaa syöteestä ei voi yhtä helposti leikata ja liimata uusia lauseita.
Tämä johtuu siitä, että uusissa lauseissa syötteen sanoja pitäisi ehkä taivuttaa eri tavalla
kuin käyttäjän syötteessä, mitä on vaikea tehdä oikein ilman lauseen kunnollista jäsentämistä
(ja se on silloinkin vaikeaa).

Lisenssi
========

Suomenkielinen Eliza on lisensoitu GNU GPLv3 -lisenssillä (tai myöhemmällä versiolla).
