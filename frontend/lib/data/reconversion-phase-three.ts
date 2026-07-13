export interface ReconversionPhaseThreeQuestion {
  id: number;
  dimension:
    | "people_guidance"
    | "analytical_depth"
    | "creative_expression"
    | "operational_drive"
    | "autonomy_need"
    | "transition_readiness";
  text: string;
}

export const reconversionPhaseThreeLabels: Record<
  ReconversionPhaseThreeQuestion["dimension"],
  string
> = {
  people_guidance: "Personas y guia",
  analytical_depth: "Analisis profundo",
  creative_expression: "Creacion y expresion",
  operational_drive: "Ejecucion concreta",
  autonomy_need: "Autonomia",
  transition_readiness: "Disposicion al cambio",
};

export const reconversionPhaseThreeQuestions: ReconversionPhaseThreeQuestion[] =
  [
    {
      id: 1,
      dimension: "people_guidance",
      text: "Si cambio de rumbo, me veo acompanando, explicando o guiando procesos de otras personas.",
    },
    {
      id: 2,
      dimension: "people_guidance",
      text: "Me sentiria mas realizado/a en un rol donde escuche, oriente o facilite decisiones.",
    },
    {
      id: 3,
      dimension: "analytical_depth",
      text: "Me atrae una reconversion donde deba investigar, entender causas y resolver problemas complejos.",
    },
    {
      id: 4,
      dimension: "analytical_depth",
      text: "Disfrutaria un trabajo donde analizar informacion sea parte central del dia a dia.",
    },
    {
      id: 5,
      dimension: "creative_expression",
      text: "Una nueva etapa laboral me haria sentido si puedo crear ideas, mensajes o experiencias distintas.",
    },
    {
      id: 6,
      dimension: "creative_expression",
      text: "Necesito sentir cierto espacio de originalidad para sostenerme motivado/a en el tiempo.",
    },
    {
      id: 7,
      dimension: "operational_drive",
      text: "Me entusiasma mas un cambio donde pueda ejecutar rapido y ver resultados concretos pronto.",
    },
    {
      id: 8,
      dimension: "operational_drive",
      text: "Prefiero una reconversion con tareas claras y avance visible, mas que solo reflexion o estrategia.",
    },
    {
      id: 9,
      dimension: "autonomy_need",
      text: "Mi proximo camino debiera darme mas libertad para decidir ritmos, formas o prioridades.",
    },
    {
      id: 10,
      dimension: "autonomy_need",
      text: "Si vuelvo a empezar, quiero un trabajo menos controlado y mas alineado con mis propios criterios.",
    },
    {
      id: 11,
      dimension: "transition_readiness",
      text: "Aunque implique esfuerzo, hoy si estoy dispuesto/a a moverme hacia un camino nuevo si veo sentido.",
    },
    {
      id: 12,
      dimension: "transition_readiness",
      text: "Podria sostener una etapa de aprendizaje o ajuste si eso me acerca a una vida laboral mas satisfactoria.",
    },
  ];
