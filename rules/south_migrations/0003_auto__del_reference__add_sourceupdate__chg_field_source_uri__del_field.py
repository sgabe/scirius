# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting model 'Reference'
        db.delete_table('rules_reference')

        # Adding model 'SourceUpdate'
        db.create_table('rules_sourceupdate', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('source', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rules.Source'])),
            ('created_date', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2014, 7, 31, 0, 0), blank=True)),
            ('data', self.gf('django.db.models.fields.TextField')()),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=42)),
        ))
        db.send_create_signal('rules', ['SourceUpdate'])


        # Changing field 'Source.uri'
        db.alter_column('rules_source', 'uri', self.gf('django.db.models.fields.CharField')(max_length=400, null=True))
        # Deleting field 'Rule.id'
        db.delete_column('rules_rule', 'id')

        # Removing M2M table for field references on 'Rule'
        db.delete_table(db.shorten_name('rules_rule_references'))


        # Changing field 'Rule.sid'
        db.alter_column('rules_rule', 'sid', self.gf('django.db.models.fields.IntegerField')(primary_key=True))

    def backwards(self, orm):
        # Adding model 'Reference'
        db.create_table('rules_reference', (
            ('value', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal('rules', ['Reference'])

        # Deleting model 'SourceUpdate'
        db.delete_table('rules_sourceupdate')


        # Changing field 'Source.uri'
        db.alter_column('rules_source', 'uri', self.gf('django.db.models.fields.CharField')(default=1, max_length=400))
        # Adding field 'Rule.id'
        db.add_column('rules_rule', 'id',
                      self.gf('django.db.models.fields.AutoField')(default=1, primary_key=True),
                      keep_default=False)

        # Adding M2M table for field references on 'Rule'
        m2m_table_name = db.shorten_name('rules_rule_references')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('rule', models.ForeignKey(orm['rules.rule'], null=False)),
            ('reference', models.ForeignKey(orm['rules.reference'], null=False))
        ))
        db.create_unique(m2m_table_name, ['rule_id', 'reference_id'])


        # Changing field 'Rule.sid'
        db.alter_column('rules_rule', 'sid', self.gf('django.db.models.fields.IntegerField')(unique=True))

    models = {
        'rules.category': {
            'Meta': {'object_name': 'Category'},
            'created_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 7, 31, 0, 0)'}),
            'descr': ('django.db.models.fields.CharField', [], {'max_length': '400', 'blank': 'True'}),
            'filename': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rules.Source']"})
        },
        'rules.rule': {
            'Meta': {'object_name': 'Rule'},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rules.Category']"}),
            'content': ('django.db.models.fields.CharField', [], {'max_length': '10000'}),
            'msg': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'rev': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'sid': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'state': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        'rules.ruleset': {
            'Meta': {'object_name': 'Ruleset'},
            'categories': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rules.Category']", 'symmetrical': 'False', 'blank': 'True'}),
            'created_date': ('django.db.models.fields.DateTimeField', [], {}),
            'descr': ('django.db.models.fields.CharField', [], {'max_length': '400', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'}),
            'sources': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rules.SourceAtVersion']", 'symmetrical': 'False'}),
            'suppressed_rules': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rules.Rule']", 'symmetrical': 'False', 'blank': 'True'}),
            'updated_date': ('django.db.models.fields.DateTimeField', [], {'blank': 'True'})
        },
        'rules.source': {
            'Meta': {'object_name': 'Source'},
            'created_date': ('django.db.models.fields.DateTimeField', [], {}),
            'datatype': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'method': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'}),
            'updated_date': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'uri': ('django.db.models.fields.CharField', [], {'max_length': '400', 'null': 'True', 'blank': 'True'})
        },
        'rules.sourceatversion': {
            'Meta': {'object_name': 'SourceAtVersion'},
            'git_version': ('django.db.models.fields.CharField', [], {'default': "'HEAD'", 'max_length': '42'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rules.Source']"}),
            'updated_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 7, 31, 0, 0)', 'blank': 'True'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '42'})
        },
        'rules.sourceupdate': {
            'Meta': {'object_name': 'SourceUpdate'},
            'created_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 7, 31, 0, 0)', 'blank': 'True'}),
            'data': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rules.Source']"}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '42'})
        }
    }

    complete_apps = ['rules']