import React, { useState } from 'react';
import DialogBox from '../components/DialogBox';
import InteriorMap from '../components/InteriorMap';
import { INTERIOR_CONFIGS, INTERIOR_MAPS } from '../data/interiorData';
import { useGame } from '../context/GameContext';

const HomeScreen = ({ navigate, direction, aPressed, screenData }) => {
  const [currentMapId, setCurrentMapId] = useState(screenData?.targetMapId || 'house_1');
  const { habitosHoy = [], gimnasiosHoy = [], template } = useGame();
  const [playerPos, setPlayerPos] = useState(screenData?.spawn || { x: 9, y: 11 }); 
  const [dialogue, setDialogue] = useState(null);
  const [isFading, setIsFading] = useState(false);

  const config = INTERIOR_CONFIGS[currentMapId] || INTERIOR_CONFIGS.house_1;
  const mapMatrix = INTERIOR_MAPS[currentMapId] || INTERIOR_MAPS.house_1;

  const handleEvent = (event) => {
    console.log("Home HUB Event:", event);
    
    // TRANSICIÓN DE ESCALERAS (Sincronizadas con Generador v8.0)
    if (event.type === 'stair') {
      const isBasement = currentMapId === 'house_1';
      const nextMap = isBasement ? 'house_2' : 'house_1';
      
      // Coordenadas ajustadas a la matriz del usuario
      // house_1 -> house_2: Al pie de la escalera en P1
      // house_2 -> house_1: Al pie de la escalera en PB
      const nextSpawn = isBasement ? { x: 10, y: 4 } : { x: 12, y: 3 };

      setIsFading(true);
      setTimeout(() => {
        setCurrentMapId(nextMap);
        setPlayerPos(nextSpawn); 
        setTimeout(() => setIsFading(false), 500);
      }, 500);
    }
    
    // HABLAR CON NPCs
    if (event.type === 'npc_talk') {
       if (event.npc.id === 'madre') {
         const completedHabits = habitosHoy.filter(h => h.completado).length;
         const totalMedals = gimnasiosHoy.filter(g => g.completado).length;
         
         let text = ["¡Hola, cielo! Un pequeño paso hoy es una gran victoria mañana.", "¿Has desayunado ya algo nutritivo?"];
         
         if (totalMedals > 0) {
           text = [`¡Increíble! ¡Ya tienes ${totalMedals} medallas!`, "Vaya cambio estás dando... Estoy muy orgullosa.", "¡Sigue esforzándote!"];
         } else if (completedHabits > 0) {
           text = [`¡Veo que hoy ya has completado ${completedHabits} hábitos!`, "¡Me encanta ver esa energía!", "¿Quieres tomarte un descanso para recuperar fuerzas?"];
         }

         setDialogue({
           name: "DRA. MAMÁ",
           text: text,
           options: [
             { label: "SÍ, DESCANSAR", value: "heal" },
             { label: "NO, ESTOY BIEN", value: "cancel" }
           ]
         });
       }
    }

    // INTERACCIÓN CON OBJETOS (Data-Driven v9.0)
    if (event.type === 'object_interact') {
      const tileId = event.tileType;

      // --- PLANTA BAJA ---
      if (currentMapId === 'house_1') {
        if ([3, 22, 26].includes(tileId)) { // Cocina / TV
          setDialogue({ name: "HOGAR", text: ["Huele a comida recién hecha.", "¡Mamá siempre cuida de todos!"] });
        } else if ([32, 33, 13, 14].includes(tileId)) { // Mesa
          setDialogue({ name: "MESA", text: ["Una mesa robusta de madera.", "Perfecta para estudiar o comer."] });
        }
      }

      // --- PLANTA ALTA ---
      if (currentMapId === 'house_2') {
        if (tileId === 1) { // PC
          setDialogue({ 
            name: "PC", 
            text: ["Conectando al Sistema de Habitmon...", "¿Quieres revisar tus tareas?"],
            options: [{ label: "REVISAR", value: "profile" }, { label: "SALIR", value: "close" }]
          });
        } else if ([40, 48].includes(tileId)) { // Cama
          setDialogue({ 
            name: "CAMA", 
            text: ["Es tu cama. Se ve muy cómoda.", "¿Quieres descansar?"],
            options: [{ label: "DORMIR", value: "heal" }, { label: "CANCELAR", value: "cancel" }]
          });
        } else if (tileId === 41) { // Radio / Mapa
          setDialogue({ name: "OBJETO", text: ["Parece una radio antigua.", "Emite una melodía relajante."] });
        }
      }
    }
  };

  const handleExit = () => navigate('city');

  const npcs = currentMapId === 'house_1' ? [
    { id: 'madre', nombre: 'Dra. Mamá', sprite: 'char_ 00_b', x: 11, y: 6, direccion: 2 }
  ] : [];

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', height: '100%', display: 'flex', alignItems: 'center' }}>
        <InteriorMap 
          map={mapMatrix}
          tileset={config.tileset}
          tileConfig={config.tiles}
          initialPos={playerPos}
          npcs={npcs}
          onEvent={handleEvent}
          onExit={handleExit}
          direction={direction}
          aPressed={aPressed}
          currentMapId={currentMapId}
        />
      </div>

      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: '#FFD700', border: '2px solid #555', padding: '6px 16px', fontFamily: '"Press Start 2P"', fontSize: 8, zIndex: 10, borderRadius: 4 }}>
        {config.nombre}
      </div>

      {dialogue && (
        <DialogBox 
          name={dialogue.name}
          text={dialogue.text}
          onComplete={() => { if (!dialogue.options) setDialogue(null); }}
          onOptionSelect={(val) => {
            if (val === 'profile') navigate('profile');
            else if (val === 'heal') {
              setDialogue(null);
              setIsFading(true);
              setTimeout(() => {
                setTimeout(() => {
                  setIsFading(false);
                  setDialogue({ name: "DRA. MAMÁ", text: ["¡Ya está! ¡Vuelve pronto y pórdate bien!"] });
                }, 1000);
              }, 500);
            }
            else setDialogue(null);
          }}
          options={dialogue.options}
        />
      )}

      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: isFading ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: 'none', zIndex: 50 }} />
    </div>
  );
};

export default HomeScreen;
