"""
Copyright(C) 2014, Stamus Networks
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


import logging

from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse

from revproxy.views import ProxyView
from scirius.utils import scirius_render, get_middleware_module

# Avoid logging every request
revproxy_logger = logging.getLogger('revproxy')
revproxy_logger.setLevel(logging.WARNING)


def homepage(request):
    context = get_middleware_module('common').get_homepage_context()
    return scirius_render(request, 'rules/home.html', context)


# Proxy
class KibanaProxyView(PermissionRequiredMixin, ProxyView):
    upstream = settings.KIBANA_URL
    add_remote_user = False
    permission_required = ['rules.events_kibana']

    def dispatch(self, request, path):
        if (path == 'api/infra/graphql' or path.startswith('api/infra/graphql/')) and \
                not settings.KIBANA_ALLOW_GRAPHQL:
            raise PermissionDenied()
        return super().dispatch(request, path)


class EveboxProxyView(PermissionRequiredMixin, ProxyView):
    upstream = "http://" + settings.EVEBOX_ADDRESS
    add_remote_user = True
    permission_required = ['rules.events_evebox']


class MolochProxyView(ProxyView):
    upstream = settings.MOLOCH_URL
    add_remote_user = False

    def get_request_headers(self):
        headers = super(MolochProxyView, self).get_request_headers()
        headers['REMOTE_USER'] = 'moloch'
        return headers


def static_redirect(request, static_path):
    if (static_path.endswith('.js') or static_path.endswith('.html') or static_path.endswith('/')) and not request.user.is_authenticated:
        raise PermissionDenied()
    response = HttpResponse(status=200)
    response['Content-Type'] = ''
    response['X-Accel-Redirect'] = '/protected-static/' + static_path
    return response
