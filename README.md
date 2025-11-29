
# 🧱 Arquitectura Base – Proyecto SaaS

Este repositorio contiene la implementación de la arquitectura base de un proyecto genérico de **Software como Servicio (SaaS)**, desarrollado como parte del Sprint 1 de la asignatura *Procesos de Ingeniería del Software*.

## 🎯 Objetivo del sistema

El sistema está orientado a servicios y se centra en la **gestión de usuarios**. Las funcionalidades implementadas en este sprint incluyen:

- Agregar usuario por nick  
- Obtener lista de usuarios  
- Verificar si un usuario está activo  
- Eliminar usuario por nick  
- Consultas adicionales sobre usuarios



## 🚀 Tecnologías utilizadas

- **NodeJS** + Express  
- **MongoDB** (planificado para futuras integraciones)  
- **Jasmine** para pruebas  
- **Bootstrap 4** + Vanilla JS para el frontend  
- **GitHub** para control de versiones  
- **Google Cloud Run** para despliegue

## 🧪 Pruebas

Las pruebas unitarias se han implementado con Jasmine y cubren los métodos principales del modelo:  
`agregarUsuario`, `obtenerUsuarios`, `usuarioActivo`, `eliminarUsuario`, `numeroUsuarios`.

## 🌐 Despliegue

El prototipo se despliega en **Google Cloud Run**. 
## 📄 Licencia

Este proyecto está bajo la licencia MIT.
