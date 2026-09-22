# Usuarios y contraseñas

## Convención

- **Usuario:** inicial del primer nombre + primer apellido, minúsculas, sin tildes (`fcastro`, `aquiceno`).
- **Clave temporal de los nuevos:** `HabKpi.2026`. Al entrar deben cambiarla.
- Castro y admin ya tienen clave propia; no se pisan al sembrar.
- Recuperar: usuario + número de asesor (`asesor_key`).
- Si dos nombres chocan, se agrega el key (`jmontoya51`).

Para regenerar la nómina desde SQL (no pisa claves existentes):

```
cd backend
uv run python scripts/seed_asesor_users.py
uv run python scripts/write_usuarios_md.py
```

No se crean genéricos, junior, B2C, inactivos ni `Sin Vendedor`.
Cartera UnoEE cruza por nombre (`vendedor_rowid`); Siesa usa `codigo_vendedor = asesor_key`.
Si `rowid` va vacío, UnoEE sale en blanco. El asesor nunca ve consolidado.

## Directorio (155 cuentas)

| Usuario | Rol | asesor_key | UnoEE rowid | Nombre |
|---------|-----|------------|-------------|--------|
| admin | admin | — | — | Administrador |
| ahernandez | asesor | 85 | 226 | ADRIANA PATRICIA HERNANDEZ IBARRA |
| aordonez | asesor | 71 | — | ALEJANDRA ORDOÑEZ CORREA |
| aarenas | asesor | 146 | 81198 | ALEJANDRO ARENAS ARENAS |
| apanesso | asesor | 91 | 257 | ALEJANDRO PANESSO ESCALLON |
| apelaez | asesor | 98 | 260 | ALEJANDRO PELAEZ TRUJILLO |
| acordoba | asesor | 105 | — | ALEXANDER CORDOBA |
| aquiceno | asesor | 114 | 34 | ALEXIS ROBERTO QUICENO |
| adiaz | asesor | 58 | 192 | ALVARO ALONSO DIAZ ALVAREZ |
| agil | asesor | 45 | — | ALVARO GIL |
| asierra | asesor | 55 | 63 | ALVARO LEON SIERRA BOTERO |
| aarrieta | asesor | 3 | 25 | ALVARO LUIS ARRIETA GONZALEZ |
| alopez | asesor | 107 | 155 | ANDRES FELIPE LOPEZ VERGARA |
| anino | asesor | 35 | — | ANDREY GERARDO NIÑO PEÑALOZA |
| agarcia | asesor | 25 | 174543 | ARLEY GARCIA SANCHEZ |
| bcastro | asesor | 40 | — | BEATRIZ CASTRO OSPINA |
| bbuitrago | asesor | 147 | 3624 | BERNARDO ADOLFO BUITRAGO SANCHEZ |
| cfernandez | asesor | 126 | 198 | CAMILO FERNANDEZ DE LA ROCHE |
| ccastano | asesor | 31 | 69 | CARLOS ALBERTO CASTAÑO GALVIS |
| chillera | asesor | 149 | 6043 | CARLOS ANDRES HILLERA VEGA |
| crestrepo | asesor | 76 | 78 | CARLOS ANDRES RESTREPO CHAVERRA |
| cestrada | asesor | 65 | 78 | CARLOS ESTEBAN ESTRADA RESTREPO |
| chinestroza | asesor | 148 | 82167 | CARLOS ESTIWAR HINESTROZA VALENCIA |
| cespinosa | asesor | 59 | 27 | CARLOS MARIO ESPINOSA PEREZ |
| csepulveda | asesor | 36 | 101 | CLAUDIA SEPULVEDA BARBOSA |
| cgarcia | asesor | 90 | 261 | CLAUDIA VIVIANA GARCIA ARDILA |
| cjaramillo | asesor | 93 | 259 | CLAUDIA YANETH JARAMILLO ESTRADA |
| dbustamante | asesor | 7 | 113 | DAIRON DE JESUS BUSTAMANTE GALLEGO |
| ddiez | asesor | 78 | 183 | DANIEL ALONSO DIEZ CANO |
| dmoreno | asesor | 103 | 430 | DANIEL ANDRES MORENO MIRANDA |
| drodriguez | asesor | 81 | 229 | DANIEL FRANCISCO RODRIGUEZ GOYES |
| darboleda | asesor | 144 | 181 | DANIEL RICARDO ARBOLEDA MARULANDA |
| dmarmolejo | asesor | 77 | 200 | DANIELA MARMOLEJO AGUILAR |
| dzamora | asesor | 39 | 88 | DIANA ALEXANDRA ZAMORA VELASCO |
| doquendo | asesor | 124 | 131 | DIEGO FERNANDO OQUENDO PRIETO |
| dcalle | asesor | 32 | 50 | DUVAN ALEXANDER CALLE |
| eruiz | asesor | 86 | — | EDGAR YESID RUIZ CARRILLO |
| ealzate | asesor | 109 | 72 | EDWIN FERNANDO ALZATE FLOREZ |
| eceron | asesor | 154 | 94046 | EDWIN FERNANDO CERON NUÑEZ |
| ejacome | asesor | 70 | 21 | EDWING YESID JACOME ARENAS |
| ebasto | asesor | 48 | — | EVELYN GIOVANNA BASTO REYES |
| fvasquez | asesor | 123 | 47 | FABER ORLANDO VASQUEZ ARROYAVE |
| fmoreno | asesor | 121 | 430 | FABIAN ANDRES MORENO CAMACHO |
| fcastro | asesor | 1 | 45 | FERNANDO CASTRO MORENO |
| fmopan | asesor | 60 | 108 | FRECNI ANTONIO MOPAN VILLAMARIN |
| ftaborda | asesor | 38 | — | FRED YIMI TABORDA GONZALEZ |
| farenas | asesor | 37 | 189 | FREDY ORLANDO ARENAS RESTREPO |
| grenteria | asesor | 153 | 29 | GABRIEL ALEXANDER RENTERIA BETANCUR |
| ggiraldo | asesor | 151 | 19309 | GERLY ROCIO GIRALDO DIAZ |
| gvillar | asesor | 74 | 195 | GLADIS VILLAR SOTO |
| gcarreno | asesor | 20 | 171914 | GONZALO CARREÑO ORTIZ |
| gherrera | asesor | 130 | 68 | GUSTAVO ADOLFO HERRERA MESA |
| gmonterrosa | asesor | 69 | 194 | GUSTAVO ADOLFO MONTERROSA POLO |
| hcaldas | asesor | 49 | 37 | HECTOR EFRAIN CALDAS MORENO |
| hbarrera | asesor | 19 | 71 | HEIVER BARRERA |
| hpalencia | asesor | 88 | 255 | HIDAEL PALENCIA OLIVEROS |
| ibernal | asesor | 164 | 130601 | ISMAEL ANDERZON BERNAL SANCHEZ |
| ihoyos | asesor | 133 | 22340 | IVAN DAVID HOYOS CASTAÑO |
| imejia | asesor | 23 | 172632 | IVAN GUILLERMO MEJIA PELAEZ |
| iguarin | asesor | 6 | 165967 | IVAN HERNESTO GUARIN AMEZQUITA |
| jvalencia | asesor | 52 | 30 | JADER ANDRES VALENCIA GALLEGO |
| jrendon | asesor | 22 | 83 | JAIME ALBERTO RENDON TORO |
| jmontoya | asesor | 26 | 162 | JAIR MONTOYA VANEGAS |
| jrojas | asesor | 161 | 106749 | JAIR EDUARDO ROJAS MATEUS |
| jmoreno | asesor | 168 | 39 | JAVIER DAVID MORENO HOLGUIN |
| jecheverria | asesor | 160 | 25761 | JEISON DAVID ECHEVERRIA TORRES |
| jrodriguez | asesor | 167 | 150221 | JERFERSON RODRIGUEZ REYES |
| jguerra | asesor | 57 | 77 | JESUS DAVID GUERRA RENDON |
| jlopez | asesor | 75 | 124 | JHON HENRY LOPEZ RAMOS |
| jarbelaez | asesor | 84 | 184 | JHONY ALEJANDRO ARBELAEZ LONDOÑO |
| juribe | asesor | 10 | 62 | JOAQUIN FERNANDO URIBE BOTERO |
| jgarces | asesor | 158 | 504 | JOHAN FERNANDO GARCES GUARIN |
| josorio | asesor | 112 | 193 | JOHN EDISON OSORIO GARCIA |
| jtejada | asesor | 64 | 18 | JOHN JAIRO TEJADA ORTIZ |
| jgomez | asesor | 79 | 221 | JONATHAN GOMEZ SALAZAR |
| jmedina | asesor | 2 | 57 | JONNY ARLEY MEDINA OCAMPO |
| jheredia | asesor | 110 | 145 | JORGE ANDRES HEREDIA GUARNIZO |
| jpaez | asesor | 125 | 36 | JORGE HERNAN PAEZ VILLARES |
| jmontoya51 | asesor | 51 | — | JORGE HUGO ALEXANDER MONTOYA GAVIRIA |
| jmejia | asesor | 15 | 48 | JOSE ALBERTO MEJIA CHAVARRIA |
| jgiraldo | asesor | 141 | 122 | JOSE DANIEL GIRALDO RUEDA |
| jmindiola | asesor | 61 | — | JOSE ELIAS MINDIOLA REINA |
| jmantilla | asesor | 80 | 227 | JOSE JAIR MANTILLA |
| jrincon | asesor | 24 | 23 | JOSE LUIS RINCON VARGAS |
| jlopez92 | asesor | 92 | 61 | JUAN ANDRES LOPEZ ATEHORTUA |
| jarcila | asesor | 102 | 153 | JUAN CAMILO ARCILA RUIZ |
| jgonzalez | asesor | 106 | 342 | JUAN CARLOS GONZALEZ BEDOYA |
| jmontoya89 | asesor | 89 | 38 | JUAN CARLOS MONTOYA ORTIZ |
| jperez | asesor | 53 | 59 | JUAN CARLOS PEREZ CHAVARRIAGA |
| jgonzalez43 | asesor | 43 | 190 | JUAN DAVID GONZALEZ TOBON |
| jhiguita | asesor | 135 | 174 | JUAN DAVID HIGUITA |
| jsandoval | asesor | 104 | — | JUAN DAVID SANDOVAL VEGA |
| jgallego | asesor | 142 | 22854 | JUAN GONZALO GALLEGO CASTAÑO |
| jrestrepo | asesor | 34 | 19196 | JUAN GUILLERMO RESTREPO RUIZ |
| jescobar | asesor | 28 | — | JUAN RICARDO ESCOBAR MORALES |
| jruiz | asesor | 145 | 73 | JULIAN RUIZ PATIÑO |
| jloaiza | asesor | 73 | 188 | JULIAN ALBERTO LOAIZA GIRALDO |
| krodriguez | asesor | 50 | 130 | KAREN ELIANA RODRIGUEZ RODRIGUEZ |
| knieto | asesor | 47 | — | KAREN PATRICIA NIETO FARIA |
| krestrepo | asesor | 165 | 22845 | KEVIN ANDRES RESTREPO RIOS |
| lhincapie | asesor | 120 | 431 | LILIANA HINCAPIE RENDON |
| lrincon | asesor | 157 | 96358 | LORENA RINCON BARBOSA |
| lpena | asesor | 101 | 264 | LUIS ALEXIS PEÑA RAMIREZ |
| lviloria | asesor | 139 | 22878 | LUIS ALFREDO VILORIA MOLANO |
| lbedoya | asesor | 159 | 239 | LUIS CARLOS BEDOYA GALLEGO |
| lpasquel | asesor | 17 | 129 | LUIS ENRIQUE PASQUEL OSORIO |
| lhoyos | asesor | 156 | 95692 | LUIS FELIPE HOYOS MESA |
| lblandon | asesor | 115 | 2985 | LUIS GUILLERMO BLANDON MUÑOZ |
| ltorralvo | asesor | 14 | 42 | LUIS RAFAEL TORRALVO HERNANDEZ |
| lgonzalez | asesor | 129 | 419 | LUISA FERNANDA GONZALEZ LOPEZ |
| mbarrera | asesor | 44 | — | MARCELA BARRERA GOMEZ |
| msalazar | asesor | 122 | 425 | MARCO ANTONIO SALAZAR SILVA |
| mramirez | asesor | 117 | 20 | MARCO EVELIO RAMIREZ GOMEZ |
| mramirez33 | asesor | 33 | 20 | MARCO EVELIO RAMIREZ GOMEZ |
| mcastano | asesor | 134 | 385 | MARLON CASTAÑO ARBOLEDA |
| mbedoya | asesor | 166 | 465 | MATEO BEDOYA HENRY |
| maguirre | asesor | 119 | 12 | MAURICIO HERNAN AGUIRRE SANCHEZ |
| mnaranjo | asesor | 83 | 228 | MAURICIO LEON NARANJO SALAZAR |
| mcastillo | asesor | 63 | — | MIGUEL JOSE CASTILLO BORDA |
| mgallego | asesor | 140 | 548 | MONICA MARIA GALLEGO HERRERA |
| nurrego | asesor | 66 | 93 | NIDIAN NORELI URREGO HERNANDEZ |
| odiaz | asesor | 67 | — | OLGA LUCIA DIAZ QUIROZ |
| ocamargo | asesor | 68 | 43 | OLIMPO JOSE CAMARGO PUERTA |
| oarcos | asesor | 132 | 22339 | OSCAR ALEXANDER ARCOS BURGOS |
| oosorio | asesor | 54 | — | OSCAR DARIO OSORIO ORREGO |
| parias | asesor | 30 | 22 | PEDRO MIGUEL ARIAS PETRO |
| pescobar | asesor | 16 | 6 | PEDRO NEL ESCOBAR AGUIRRE |
| rescobar | asesor | 155 | 94049 | RAFAEL ANTONIO ESCOBAR SANCHEZ |
| rserna | asesor | 27 | 94049 | RAFAEL ANTONIO SERNA NARANJO |
| rmunoz | asesor | 128 | 358 | RENE FERNANDO MUÑOZ PALACIO |
| rrosero | asesor | 18 | 17 | RICARDO ALEXANDER ROSERO SOLARTE |
| rcorrea | asesor | 163 | 332 | ROBERT NICOLAS CORREA ARIAS |
| rhincapie | asesor | 13 | 53 | ROGELIO DE JESUS HINCAPIE GIL |
| salvarez | asesor | 46 | — | SANDRA VIVIANA ALVAREZ ARBOLEDA |
| sflorez | asesor | 138 | 331 | SEBASTIAN FLOREZ MAYA |
| sjaramillo | asesor | 111 | 144 | SEBASTIAN JARAMILLO VELEZ |
| sortiz | asesor | 162 | 139 | SEBASTIAN ORTIZ RAMIREZ |
| squintero | asesor | 108 | 128 | SEBASTIAN QUINTERO SALDARRIAGA |
| stabares | asesor | 21 | 171917 | SEBASTIAN TABARES ESPINOSA |
| scorrea | asesor | 113 | 241 | SEBASTIAN DE JESUS CORREA PUERTA |
| sgomez | asesor | 118 | 52 | SERGIO ALBERTO GOMEZ CASTAÑO |
| svelez | asesor | 152 | 115 | SERGIO ANDRES VELEZ DUQUE |
| smaya | asesor | 62 | — | SHIRLEY MAYA RAMIREZ |
| tosorio | asesor | 56 | — | TATIANA OSORIO ALVAREZ |
| tmiranda | asesor | 136 | 103 | TOMAS HERNAN MIRANDA LONDOÑO |
| vbecerra | asesor | 82 | — | VICTOR ANGEL BECERRA SIERRA |
| wgutierrez | asesor | 150 | 82945 | WILINTON GUTIERREZ NORIEGA |
| wacevedo | asesor | 143 | 396 | WILLIAM ALBERTO ACEVEDO ALZATE |
| wsaenz | asesor | 100 | 263 | WILLIAM ALEJANDRO SAENZ GARCIA |
| wlinares | asesor | 72 | 24 | WILLIAM ALEXANDER LINARES RATIVA |
| wacevedo127 | asesor | 127 | 233 | WILLIAM HERNANDO ACEVEDO ARANGO |
| wvalencia | asesor | 131 | 140 | WUIL BRAJHAM VALENCIA VELASQUEZ |
| ycampos | asesor | 87 | 256 | YAMIL CAMPOS GALINDO |
| yrivillas | asesor | 4 | 107 | YHON WILLIAM RIVILLAS MONTOYA |
| zbeltran | asesor | 137 | 22881 | ZULAY BELTRAN PLAZA |
