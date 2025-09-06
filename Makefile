OPENAPI?=docs/openapi.yaml

.PHONY: openapi-validate
openapi-validate:
	@echo "Validating $(OPENAPI) with openapi-spec-validator..."
	@python -m pip install --quiet openapi-spec-validator PyYAML >/dev/null 2>&1 || true
	@python - <<'PY'
import sys, json, yaml
from openapi_spec_validator import validate_spec
with open("$(OPENAPI)") as f:
    spec = yaml.safe_load(f)
validate_spec(spec)
print("OK: $(OPENAPI) is a valid OpenAPI 3 spec")
PY

.PHONY: openapi-validate-docker
openapi-validate-docker:
	@docker run --rm -v "$$(pwd)":/work -w /work redocly/openapi-cli:latest lint $(OPENAPI)
