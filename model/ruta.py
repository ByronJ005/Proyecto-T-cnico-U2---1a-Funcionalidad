#-*- coding: utf-8 -*-

from django.db import models

class Ruta(models.Model):
    class Meta:
        pass

    origen = models.CharField()
    destino = models.CharField()
    precio = models.FloatField()
    duracionHoras = models.FloatField()


