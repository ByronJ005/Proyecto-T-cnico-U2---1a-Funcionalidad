#-*- coding: utf-8 -*-

from django.db import models

class Ciudad(models.Model):
    class Meta:
        pass

    nombre = models.CharField()


