import sys
from pathlib import Path
import pytest
sys.path.insert(0, str(Path(__file__).parents[1]))

from app.content_extractor import SourceQualityError, validate_evidence_text

def test_not_found_page_is_never_accepted_as_evidence():
    with pytest.raises(SourceQualityError, match='error/not-found'):
        validate_evidence_text('404 Page Not Found', 'https://grow.google/intl/pk/scholarships', 'Google Developer Scholarships')

def test_generic_homepage_without_specific_opportunity_is_rejected():
    with pytest.raises(SourceQualityError, match='generic homepage'):
        validate_evidence_text('Welcome to DAAD. International academic exchange.', 'https://www.daad.de/de/', 'DAAD Scholarships')

def test_specific_homepage_content_can_be_accepted():
    validate_evidence_text('PEEF offers merit scholarships and student support.', 'https://www.peef.org.pk/', 'PEEF Merit & Need-Based Scholarship')
