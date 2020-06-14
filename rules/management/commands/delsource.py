"""
Copyright(C) 2018, Stamus Networks
Written by Eric Leblond <eleblond@stamus-networks.com>

This file is part of Scirius.

Scirius is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Scirius is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Scirius.  If not, see <http://www.gnu.org/licenses/>.
"""


from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from rules.models import Source

class Command(BaseCommand):
    help = 'Delete a source'

    def add_arguments(self, parser):
        parser.add_argument('name', help='Source name')

    def handle(self, *args, **options):
        name = options['name']

        source = Source.objects.filter(name = name).delete()
        self.stdout.write('Successfully deleted source "%s"' % name)
