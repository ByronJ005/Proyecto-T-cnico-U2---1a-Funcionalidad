#-*- coding: utf-8 -*-

from django.db import models

class Turno(models.Model):
    class Meta:
        pass

    fechaSalida = models.DateField()
    horaSalida = models.TimeField()
    cuposDisponibles = models.IntegerField()


