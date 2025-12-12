#-*- coding: utf-8 -*-

from django.db import models

class Bus(models.Model):
    class Meta:
        pass

    anioFabricacion = models.IntegerField()
    placa = models.CharField()
    modelo = models.CharField()
    capacidad = models.IntegerField()


