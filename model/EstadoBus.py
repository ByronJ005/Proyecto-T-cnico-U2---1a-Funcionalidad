#!/usr/bin/python
#-*- coding: utf-8 -*-

from enum import Enum

class EstadoBus(Enum):
    Disponible = 1
    EnMantenimiento = 2
    FueraDeServicio = 3
