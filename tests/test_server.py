import unittest
from copy import deepcopy
from server import validate_extraction, validate_report

class ObservationTests(unittest.TestCase):
    def setUp(self):
        self.note = 'The gate is open and there are no steps.'
        self.result = {'amenity':'entrance','status':'usable','step_free':'yes','shade':'unknown',
                       'summary':'The gate is open with no steps observed.', 'evidence':'there are no steps',
                       'helps':['People avoiding steps']}

    def test_exact_evidence_is_required(self):
        self.assertEqual(validate_extraction(self.result, self.note)['step_free'], 'yes')
        self.result['evidence'] = 'The entire park is accessible.'
        with self.assertRaises(ValueError):
            validate_extraction(self.result, self.note)

    def test_missing_unknown_is_rejected(self):
        self.result['shade'] = None
        with self.assertRaises(ValueError):
            validate_extraction(self.result, self.note)

    def test_unmentioned_access_and_shade_are_unknown(self):
        result = {**self.result, 'amenity':'bench','status':'unusable','step_free':'no',
                  'shade':'yes','evidence':'The bench is broken.'}
        cleaned = validate_extraction(result, 'The bench is broken.')
        self.assertEqual(cleaned['step_free'], 'unknown')
        self.assertEqual(cleaned['shade'], 'unknown')

    def test_invalid_and_unconfirmed_reports_are_rejected(self):
        report = {**self.result, 'id':'abc','place_id':'entrance','note':self.note,
                  'source':'live','created_at':'2026-10-11T13:30:00Z','confirmed':True}
        self.assertEqual(validate_report(report)['id'], 'abc')
        for key, value in [('confirmed',False),('created_at','nonsense'),('status','safe'),
                           ('place_id','someone-home'),('summary',''),('source','invented')]:
            with self.subTest(key=key):
                bad = deepcopy(report)
                bad[key] = value
                with self.assertRaises(ValueError):
                    validate_report(bad)

if __name__ == '__main__':
    unittest.main()
