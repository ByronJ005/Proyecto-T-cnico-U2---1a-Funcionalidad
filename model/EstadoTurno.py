#!/usr/bin/python
#-*- coding: utf-8 -*-

from enum import Enum

class EstadoTurno(Enum):
    Programado = 1
    EnCurso = 2
    Finalizado = 3
    Cancelado = 4
