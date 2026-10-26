"""
Contexte de requête : permet aux couches modèle (corbeille, audit) de connaître
l'utilisateur courant et son adresse IP sans les faire transiter partout.

DRF recopie l'utilisateur authentifié (JWT) sur la requête Django sous-jacente,
donc ``request.user`` est fiable au moment où la vue s'exécute.
"""
from contextvars import ContextVar

_current_request = ContextVar('current_request', default=None)


class CurrentRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = _current_request.set(request)
        try:
            return self.get_response(request)
        finally:
            _current_request.reset(token)


def get_current_request():
    return _current_request.get()


def get_current_user():
    request = get_current_request()
    user = getattr(request, 'user', None) if request is not None else None
    if user is not None and getattr(user, 'is_authenticated', False):
        return user
    return None


def get_client_ip(request=None):
    request = request or get_current_request()
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip() or None
    return request.META.get('REMOTE_ADDR') or None
