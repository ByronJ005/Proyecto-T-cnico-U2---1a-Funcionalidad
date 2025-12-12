#-*- coding: utf-8 -*-

from django.db import models

class Rol(models.Model):
    class Meta:
        pass

    nombreRol = models.CharField()
    descripcion = models.TextField()


