#-*- coding: utf-8 -*-

from django.db import models

class Usuario(models.Model):
    class Meta:
        pass

    nombres = models.CharField()
    apellidos = models.CharField()
    nombreUsuario = models.CharField()
    clave = models.CharField()
    activo = models.BooleanField()
    telefonoContacto = models.CharField()
    numeroIdentificacion = models.CharField()


