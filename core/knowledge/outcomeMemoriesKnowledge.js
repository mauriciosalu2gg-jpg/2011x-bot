// ═══════════════════════════════════════════════════════════════
// 📚 Enciclopedia Exhaustiva de Outcome Memories (Roblox / 1sobbe)
// Mecánicas, Matchups, Bugs, Glitches, Trucos, Soluciones y Meta
// ═══════════════════════════════════════════════════════════════

export const OUTCOME_MEMORIES_KNOWLEDGE = `
### 🎮 ENCICLOPEDIA MAESTRA: "OUTCOME MEMORIES" (Roblox / 1sobbe):

#### ⏱️ REGLAS GENERALES Y SISTEMA DE TIEMPOS:
- **Salida / Green Ring**: Aparece a las **1:20 (80 segundos restantes)** en un spawn aleatorio (excepto en *You Can't Run*, donde se abren todas las compuertas de la fábrica).
- **LMS (Last Man Standing)**: Se activa cuando queda **1 solo superviviente vivo**. Otorga buffs de velocidad, más salud y reducción de tiempos de recarga (cooldowns reducidos), con música tensa dedicada.
- **Sistema de Física**: Sin barra de estamina clásica. Se basa en aceleración, verticalidad y el uso exacto de **i-frames (invincibility frames / cuadros de invulnerabilidad)**.

---

#### 🐛 BUGS, GLITCHES, ERRORES COMUNES Y SOLUCIONES TÉCNICAS:

1. **Hitbox Desync / "Jank" de Red**:
   - *Error*: Debido al motor de físicas de Roblox y la latencia del servidor, los dashes rápidos (como la Carga de 2011X o Chaos Dash de Fleetway) pueden conectar golpes incluso si en tu pantalla parecía que habías esquivado.
   - *Solución / Truco*: No esquives en el último milisegundo; salta en diagonal hacia arriba y usa la verticalidad para romper la caja de colisión horizontal del ejecutor.

2. **Loop Infinito de Ragdoll en Bumpers (Not Perfect)**:
   - *Error*: Si un jugador choca o rebota entre dos bumpers muy cercanos, el personaje entra en un bucle infinito de ragdoll del que no puede pararse.
   - *Solución*: Jamás usar habilidades de movilidad (dashes o spindash) cerca de los bumpers; atravesar esas zonas caminando con cuidado.

3. **"Cheese Spots" y Zonas Altas**:
   - *Truco*: Zonas inaccesibles en los techos de *You Can't Run* o copas de árboles en *Green Hill* a las que Tails o Cream suben para evitar ataques terrestres.
   - *Counter del Ejecutor*: Fleetway puede volar directamente hasta ellos, y 2011X puede cazarlos si trepan por desniveles o usando la distorsión de Trickery para sorprenderlos al descender.

4. **Drop Dash Animation Lock ("Dropbash")**:
   - *Error*: Si Sonic activa el Drop Dash en una rampa con desnivel abrupto, puede quedar trabado en la animación de giro sin velocidad ni i-frames.
   - *Solución*: Activar el Drop Dash siempre en superficies planas o en caída libre limpia.

5. **Fallo de Registro al Entrar al Green Ring**:
   - *Error*: Entrar al Green Ring rodando a ras de suelo con Drop Dash en momentos de lag a veces no activa el trigger de escape instantáneo.
   - *Solución*: Entrar al anillo **saltando directamente hacia el centro**, nunca rodando por el borde inferior.

6. **Congelamiento al Escalar Muros (Knuckles en Hill.GYM)**:
   - *Error*: Quedar pegado a la pared tras recibir un stun de proyectil mientras escalas.
   - *Solución*: Tocar la tecla de salto dos veces rápidamente para forzar el desenganche de colisión.

---

#### 👹 EJECUTORES (EXEs), TÉCNICAS Y PRO COUNTERS:

1. **2011X (Tú / X)**:
   - *Charge (Embestida)*: Carga masiva en línea recta. Castiga duramente a supervivientes que acaban de aterrizar o que gastaron sus i-frames.
   - *Trickery (Invisibilidad/Acecho)*: Camuflaje y distorsión para atacar sin dar pistas de audio.
   - *Rage Mode (Furia)*: Se llena cuando los supervivientes te stunean repetidamente. Al llenarse, otorga velocidad desenfrenada, daño letal e inmunidad a stuns.
   - *Pro Tip vs 2011X*: **No spamear stuns inútiles** (Amy/Eggman); solo stunealo si el equipo necesita escapar de inmediato, de lo contrario le regalarán el modo Rage.

2. **Kolossos (Tanque / Raid Boss)**:
   - *Habilidades*: Agarre elástico a larga distancia (*Long-range Grab*), *Wall-slam* (estrellar supervivientes contra paredes) y *Block* frontal que anula stuns.
   - *Debilidad*: Su bloqueo solo cubre 180° frontales. Es vulnerable por la espalda y desde el aire (Knuckles planeando o martillazo aéreo de Amy).

3. **Fleetway Super Sonic (Aéreo Caótico)**:
   - *Habilidades*: Vuelo libre, *Chaos Dash* de alta velocidad y *Fateful Drain* para drenar salud.
   - *Debilidad*: Muy difícil de maniobrar en pasillos cerrados y techos bajos. Stuns aéreos certeros lo derriban al suelo.

4. **Tripwire (Tails Doll / Trampera)**:
   - *Habilidades*: Minas terrestres invisibles/semivisibles cerca de chokepoints y spawns del Green Ring, e hilos láser.
   - *Hard Counter*: **Blaze the Cat** destruye y desactiva todas sus minas con sus llamas.

---

#### 🏃 SUPERVIVIENTES (SURVIVORS), COOLDOWNS Y META-GAME:

- **Sonic**: Maestro del loop. Su *Drop Dash* da **i-frames** reales al rodar; reservarlo para esquivar la embestida de 2011X. Su *Peelout* tiene 40s de cooldown (se reduce a 25s al cargar a un compañero).
- **Cream the Rabbit**: Curación indispensable y planeo con orejas (*Gliding*). *Cheese* puede cancelar el inicio de la carga del ejecutor. Proteger a Cream es la regla número 1 del equipo.
- **Blaze the Cat**: Dashing y saltos de fuego con i-frames; limpiadora oficial de trampas de Tripwire.
- **Tails**: Vuelo vertical y **capacidad de cargar a otros jugadores** por el aire para rescatarlos de caídas, del núcleo en YCR o de los agarres de Kolossos.
- **Knuckles**: Glide, escalar muros y puñetazo cargado con stun pesado.
- **Amy Rose**: Martillo *Piko Piko* para stunear cuerpo a cuerpo y aura de velocidad para el equipo.
- **Metal Sonic**: Guardián tanque que absorbe golpes letales con su escudo reflector para salvar a aliados débiles.
- **Shadow**: *Chaos Control* (teletransporte / esquiva dimensional con i-frames) y *Chaos Spear*.
- **Silver**: Telequinesis para repeler proyectiles y empujar al ejecutor.
- **Dr. Eggman**: Torretas defensivas, escudos de fuerza y pistolas láser.

---

#### 🗺️ SECRETOS Y TRUCOS POR MAPA:
- **Green Hill**: Usa puentes colgantes para hacer loops. A las 1:20 caen rayos que aplican el estado "Burn" (Quemadura) continuo.
- **You Can't Run (YCR)**: En los últimos segundos, aléjate del **núcleo energético** al fondo, ya que explota en una onda letal que mata instantáneamente a cualquier survivor. Aquí todas las salidas de la fábrica se abren.
- **Not Perfect**: Evita saltar hacia los bumpers para no quedar atrapado en estado Ragdoll.
- **Angel Island**: Evita zonas con fuego permanente en el piso; usa las copas de los árboles.
`.trim();

export default OUTCOME_MEMORIES_KNOWLEDGE;
