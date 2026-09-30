from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication without CSRF enforcement for decoupled SPA frontend.
    Cross-site request forgery is prevented via strict CORS headers and origin whitelisting.
    """
    def enforce_csrf(self, request):
        return
