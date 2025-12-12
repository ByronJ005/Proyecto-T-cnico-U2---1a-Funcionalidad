#!/usr/bin/python
#-*- coding: utf-8 -*-

from enum import Enum

class EstadoReserva(Enum):
    Pendiente = 1
    Confirmada = 2
    Cancelada = 3
    Completada = 4
