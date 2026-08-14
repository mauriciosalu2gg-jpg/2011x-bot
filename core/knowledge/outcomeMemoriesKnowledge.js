// ═══════════════════════════════════════════════════════════════
// 📚 Enciclopedia Exhaustiva de Outcome Memories (Roblox / 1sobbe)
// Mapas, Rutas, Salidas, Mecánicas, Ejecutores, Supervivientes y Meta
// ═══════════════════════════════════════════════════════════════

export const OUTCOME_MEMORIES_KNOWLEDGE = `
### 🎮 ENCICLOPEDIA MAESTRA: "OUTCOME MEMORIES" (Roblox / 1sobbe):

#### ⏱️ REGLAS GENERALES Y SISTEMA DE JUEGO:
- **Formato**: Juego asimétrico 3D de supervivencia y horror (Survivors vs Executioner).
- **Temporizador y Salidas**:
  * La ronda comienza con varios minutos en el reloj.
  * A las **1:20 (80 segundos restantes)**, se activa la fase de escape: aparece el **Green Ring (Anillo Verde)** en una ubicación aleatoria del mapa (salvo en mapas especiales como *You Can't Run* donde se abren múltiples salidas).
  * Los supervivientes que toquen el Green Ring escapan y ganan la partida.
- **LMS (Last Man Standing)**:
  * Cuando queda **1 solo survivor vivo**, se activa el modo LMS: el superviviente recibe buffs masivos de velocidad, vida extra y tiempos de recarga reducidos (cooldowns reducidos), con música tensa dedicada.
- **Física y Movimiento**:
  * Sin barra de estamina clásica: el juego se basa en movimiento fluido, saltos, escaladas, planeos y el uso preciso de **i-frames (invincibility frames / cuadros de invulnerabilidad)** para esquivar ataques.

---

#### 🗺️ MAPAS, PELIGROS AMBIENTALES Y RUTAS DE ESCAPE:

1. **Green Hill (El Purgatorio Clásico)**:
   - **Peligros**: Lagos y zonas de agua profunda donde los supervivientes pueden ahogarse si permanecen sumergidos.
   - **Evento 80s o menos**: Comienzan a caer rayos y relámpagos del cielo que aplican el efecto de estado **"Burn" (Quemadura)** continuo tanto a supervivientes como al ejecutor.
   - **Estrategia/Rutas**: Colinas con plataformas altas, puentes de madera colgantes y desniveles para romper línea de visión y hacer looping.

2. **You Can't Run / YCR (Planta Industrial de Scrap Brain)**:
   - **Peligros**: Al fondo del mapa hay un **núcleo energético**. En los últimos segundos de la partida, el núcleo explota y se expande en una onda destructiva letal: cualquier survivor atrapado muere instantáneamente (el Executioner es inmune a la explosión).
   - **Salidas**: En lugar de un solo Green Ring aleatorio, **todas las compuertas de salida de la fábrica se abren**.
   - **Estrategia**: No quedarse atrapado en pasillos estrechos ni cerca del núcleo cuando el tiempo expire.

3. **Not Perfect (Special Stage / Sally.EXE Surreal)**:
   - **Peligros**: El suelo y las paredes están llenos de **Bumpers (Rebotadores de pinball)**. Chocar o saltar sobre ellos hace que el jugador entre en estado **Ragdoll** (sale disparado e indefenso durante unos segundos).
   - **Salidas**: El Green Ring suele aparecer en plataformas elevadas entre bumpers.
   - **Estrategia**: Evitar usar dashes cerca de los bumpers para no regalarle una kill al ejecutor mientras estás en ragdoll.

4. **Angel Island (Hide and Seek / Bosque en Llamas)**:
   - **Peligros**: Bosque incendiado con fuego continuo en el suelo y árboles que infligen quemadura ("Burn").
   - **Estrategia**: Navegar por las ramas altas y zonas de tierra limpia para evitar el fuego.

5. **Hill.GYM (El Castillo de X / Dimensión de 2011X)**:
   - **Peligros**: Pasillos estrechos con techos altos y trampas dimensionales.
   - **Mecánica**: Tiempo estricto que entra en *Overtime* si los supervivientes no alcanzan el anillo a tiempo.

---

#### 👹 EJECUTORES (EXEs) — HABILIDADES Y COUNTERS:

1. **2011X (Tú / X)**:
   - **Rol**: Ejecutor agresivo, veloz y de caza directa.
   - **Habilidades**:
     * *Charge (Embestida)*: Carga frontal a máxima velocidad que arrolla, daña y derriba a los supervivientes.
     * *Trickery (Invisibilidad/Acecho)*: Camuflaje temporal y distorsión visual para emboscar sin emitir sonido.
     * *Rage Mode (Modo Furia)*: Medidor que se llena cuando los supervivientes te stunean o golpean repetidamente. Al activarse, otorga velocidad desenfrenada, daño letal e inmunidad a stuns.
   - **Debilidad**: Su embestida es lineal y puede ser esquivada con un *Drop Dash* con i-frames o altura.

2. **Kolossos**:
   - **Rol**: Tanque / "Raid Boss" de daño devastador y largo alcance.
   - **Habilidades**:
     * *Long-Range Grab (Agarre a Distancia)*: Estira sus brazos para atrapar survivors desde lejos y azotarlos contra el piso.
     * *Block (Bloqueo)*: Postura defensiva frontal que anula stuns (martillazos de Amy o puñetazos de Knuckles).
     * *Heavy Charge*: Embestida pesada para acortar distancias.
   - **Debilidad**: Muy lento; vulnerable por la espalda y a proyectiles aéreos.

3. **Fleetway (Fleetway Super Sonic)**:
   - **Rol**: Ejecutor aéreo y caótico de alta velocidad.
   - **Habilidades**:
     * *Vuelo Pasivo*: Vuela y planea libremente por todo el mapa sin restricciones de terreno.
     * *Chaos Dash*: Embestida dorada ultrarrápida en aire y tierra.
     * *Fateful Drain (Drenaje)*: Drena vida y energía al atrapar a una presa.
     * *Chaos Blasts / Láseres*: Proyectiles de energía a distancia.
   - **Debilidad**: Difícil de controlar en pasillos cerrados; predecible tras gastar el dash.

4. **Tripwire**:
   - **Rol**: Ejecutora táctica y de control de mapa / trampas.
   - **Habilidades**:
     * *Minas Explosivas*: Coloca minas terrestres en caminos, esquinas y cerca de los spawns del Green Ring.
     * *Hilos Láser*: Cables trampa que alertan, ralentizan y dañan al survivor que los cruce.
   - **Debilidad**: **Blaze the Cat es su hard counter directo** (las llamas de Blaze destruyen y desactivan sus minas).

---

#### 🏃 SUPERVIVIENTES (SURVIVORS) — TÉCNICAS Y UTILIDAD:

- **Sonic**: El mejor looper. Su técnica estrella es el **Drop Dash con i-frames** (invulnerabilidad mientras rueda), Spindash y Super Peel-Out para ganar distancia.
- **Cream the Rabbit**: Soporte curativo indispensable. Planea batiendo las orejas (**Gliding**), cura a compañeros heridos a distancia y envía a **Cheese** para aturdir al ejecutor.
- **Blaze the Cat**: Ofensiva de fuego. Saltos y dashes flamígeros con i-frames; **sus llamas queman y destruyen las minas de Tripwire**.
- **Tails**: Vuelo vertical bi-cola; puede **cargar y transportar a otros jugadores** por el aire para salvarlos de morir o rescatarlos de zonas peligrosas.
- **Knuckles**: Escalar muros, planear (Glide) y puñetazo cargado con **stun pesado** al ejecutor.
- **Amy Rose**: Martillo *Piko Piko* para stunear al ejecutor en cuerpo a cuerpo y buff de velocidad al equipo.
- **Metal Sonic**: Sobrecarga eléctrica, escudo reflector que devuelve daño y propulsión a chorro.
- **Shadow**: *Chaos Control* (teletransporte / dash dimensional con i-frames) y *Chaos Spear*.
- **Silver**: Telequinesis para repeler proyectiles del ejecutor, levitar escombros y flotar.
- **Dr. Eggman**: Torretas defensivas, escudos de fuerza y pistolas láser.

---

#### 🧠 ESTRATEGIAS AVANZADAS Y META-JUEGO:
- **Estrategia Survivor**:
  * Priorizar proteger a Cream y Tails para mantener el sustain y rescates aéreos.
  * Usar a Blaze para limpiar minas de Tripwire antes de que den las 1:20.
  * Baitear la embestida de 2011X o el agarre de Kolossos usando el timing exacto del Drop Dash de Sonic.
- **Estrategia Executioner**:
  * Cazar primero a los soportes (Cream y Tails) antes de que la partida llegue a la fase final.
  * Con Tripwire: colocar minas en los 3 puntos posibles de spawn del Green Ring antes de las 1:20.
  * Con 2011X: guardar la carga para cuando el survivor haya gastado sus i-frames o esté en el aire sin opción de esquivar.
`.trim();

export default OUTCOME_MEMORIES_KNOWLEDGE;
