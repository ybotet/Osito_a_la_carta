# Carpeta `docs/memory/`

Esta carpeta contiene la **memoria técnica del proyecto** organizada por temas. El archivo principal es `docs/MEMORY.md` (índice corto), que enlaza a los archivos de tema en `docs/memory/topics/`.

## Estructura

```
docs/
├── MEMORY.md                 # Índice (<150 líneas): punteros + estado actual resumido
└── memory/
    ├── README.md             # Este archivo
    └── topics/
        ├── estado-actual.md          # Snapshot del proyecto (arquitectura, comandos, versiones)
        ├── decisiones-arquitectura.md  # Decisiones clave con contexto y alternativas
        ├── gotchas-y-problemas-conocidos.md  # Lista viva de gotchas para no tropezar dos veces
        ├── historial-tareas.md       # Entradas cronológicas por tarea (qué, cómo, por qué, impacto)
        └── convenciones-proyecto.md  # Convenciones de código, commits, proceso, naming
```

## Cómo usar

- **Al iniciar una tarea**: lee `docs/MEMORY.md` para el estado actual y ve al tema relevante en `topics/`.
- **Al terminar una tarea**: agrega una entrada en `historial-tareas.md` (formato estándar). Si hay decisiones nuevas, añádelas a `decisiones-arquitectura.md`. Si descubres gotchas, añádelos a `gotchas-y-problemas-conocidos.md`.
- **Nunca borres contenido**: si una decisión se revierte, agrega una entrada nueva explicando el cambio. El historial es valioso.
- **El TASKLIST.md** (en `docs/`) es la lista de verificación de tareas (hecha/pendiente/bloqueada). Aquí **no** van decisiones ni gotchas.

## Formato de entrada en `historial-tareas.md`

### [fecha] — [T-XXX] [título corto]
**Estado:** completada | bloqueada | parcial

**Qué se hizo:**
- Bullet 1
- Bullet 2

**Cómo se hizo:**
- Archivos creados/modificados (rutas)
- Decisiones técnicas tomadas
- Dependencias agregadas (y por qué)

**Por qué se hizo así:**
- Motivo de la decisión principal
- Alternativas descartadas y por qué

**Impacto en otras tareas:**
- Tareas que dependen de esto
- Tareas que quedan bloqueadas
- Cambios que afectan a otras partes del código

**Pendientes / deuda técnica:**
- Cosas que quedaron sin hacer (y por qué)
- Refactors que se posponen

---

> **Regla de separación:**
> - `TASKLIST.md` = ¿está hecho o no? (checkbox + criterio de una línea)
> - `MEMORY.md` + `topics/` = ¿qué se hizo y cómo? (decisiones, gotchas, historial, convenciones)