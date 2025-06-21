from django.test import TestCase
from ..models import Debate, Topic

class DebateModelTest(TestCase):

    def setUp(self):
        self.topic = Topic.objects.create(title="Sample Topic")
        self.debate = Debate.objects.create(topic=self.topic, status="active")

    def test_debate_creation(self):
        self.assertEqual(self.debate.topic.title, "Sample Topic")
        self.assertEqual(self.debate.status, "active")

    def test_debate_str(self):
        self.assertEqual(str(self.debate), f"Debate on {self.debate.topic.title}")

    def test_debate_status(self):
        self.debate.status = "completed"
        self.debate.save()
        self.assertEqual(self.debate.status, "completed")