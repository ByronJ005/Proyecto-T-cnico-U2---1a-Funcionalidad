#-*- coding: utf-8 -*-

from django.db import models

class Reserva(models.Model):
    class Meta:
        pass

    fecha = models.DateField()
    hora = models.TimeField()
    asiento = models.IntegerField()


