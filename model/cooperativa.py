#-*- coding: utf-8 -*-

from django.db import models

class Cooperativa(models.Model):
    class Meta:
        pass

    nombre = models.CharField()
    urlSitio = models.CharField()
    telefonoContacto = models.CharField()
    activa = models.BooleanField()


