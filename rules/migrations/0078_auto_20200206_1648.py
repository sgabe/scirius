# -*- coding: utf-8 -*-
# Generated by Django 1.11.20 on 2020-02-06 16:48


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rules', '0077_auto_20191002_0820'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ruleprocessingfilter',
            name='action',
            field=models.CharField(max_length=10),
        ),
    ]
