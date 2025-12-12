#-*- coding: utf-8 -*-

from django.db import models

class TarifaPreferencial(models.Model):
    class Meta:
        pass

    nombre = models.CharField()
    descuento = models.FloatField()
    descripcion = models.TextField()


