from pathlib import Path
from django.http import FileResponse, Http404
from django.shortcuts import render


def swagger_ui(request):
    return render(request, "swagger.html", {})


def openapi_yaml(request):
    path = Path(__file__).resolve().parent.parent / "docs" / "openapi.yaml"
    if not path.exists():
        raise Http404("OpenAPI spec not found")
    return FileResponse(open(path, "rb"), content_type="application/yaml")

