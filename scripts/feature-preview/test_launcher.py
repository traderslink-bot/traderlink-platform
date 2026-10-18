"""Focused launcher refusal checks; no real workload or server is started."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('preview', '/workspaces/traderslink-coordinator/codex-setup/start-feature-preview.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)

class GuardTests(unittest.TestCase):
    def test_active_build_is_not_bypassed_by_available_memory(self):
        with patch.object(preview, 'active_builds', return_value=['existing build']), patch.object(preview, 'memory_available', return_value=9_000_000):
            with self.assertRaisesRegex(preview.Refused, 'another_build_is_active'):
                preview.startup_guards()

    def test_low_memory_refuses_start(self):
        with patch.object(preview, 'active_builds', return_value=[]), patch.object(preview, 'memory_available', return_value=100):
            with self.assertRaisesRegex(preview.Refused, 'low_available_memory'):
                preview.startup_guards()

    def test_adequate_memory_and_no_build_pass(self):
        with patch.object(preview, 'active_builds', return_value=[]), patch.object(preview, 'memory_available', return_value=3_000_000):
            preview.startup_guards()

    def test_profile_names_cannot_escape_registration_directory(self):
        with self.assertRaisesRegex(preview.Refused, 'invalid_profile_name'):
            preview.load_profile('../other')

    def test_reserved_ports_are_refused_before_start(self):
        for port in (3013, 3015, 80, 65536):
            with tempfile.TemporaryDirectory() as root:
                folder = Path(root) / 'preview-profiles'
                folder.mkdir()
                (folder / 'test.json').write_text(json.dumps({'root': '/workspaces/traderlink-membership-qa', 'port': port}))
                with patch.object(preview, 'BASE', Path(root)):
                    with self.assertRaisesRegex(preview.Refused, 'reserved_or_invalid_port'):
                        preview.load_profile('test')

    def test_changed_head_requires_review(self):
        with tempfile.TemporaryDirectory() as root:
            folder = Path(root) / 'preview-profiles'
            folder.mkdir()
            (folder / 'test.json').write_text(json.dumps({'root': '/workspaces/traderlink-membership-qa', 'port': 3033, 'head': 'a' * 40}))
            with patch.object(preview, 'BASE', Path(root)), patch.object(preview, 'command', side_effect=['/workspaces/traderlink-platform/.git', 'b' * 40]):
                with self.assertRaisesRegex(preview.Refused, 'checkout_changed_requires_profile_review'):
                    preview.load_profile('test')

if __name__ == '__main__':
    unittest.main()
