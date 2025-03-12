
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  MoveDown, 
  MoveUp,
  Image as ImageIcon,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Section, Question, Option, Quiz } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface QuizFormProps {
  editMode?: boolean;
  quizId?: string;
}

const QuizForm: React.FC<QuizFormProps> = ({ editMode = false, quizId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateQuizCode = () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `arena-${randNum}`;
  };

  const [quizData, setQuizData] = useState<Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    title: '',
    code: generateQuizCode(),
    instructions: '',
    duration: 60,
    startDateTime: new Date().toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    sections: [{
      id: '1',
      title: 'Section 1',
      instructions: '',
      questions: []
    }]
  });

  const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuizData(prev => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (sectionId: string, field: string, value: string) => {
    setQuizData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    }));
  };

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: `Section ${quizData.sections.length + 1}`,
      instructions: '',
      questions: []
    };
    
    setQuizData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (sectionId: string) => {
    setQuizData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addQuestion = (sectionId: string) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      options: [
        { id: '1', text: '', isCorrect: true },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false }
      ],
      marksForCorrect: 1,
      marksForWrong: 0,
      marksForUnattempted: 0
    };
    
    setQuizData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, questions: [...section.questions, newQuestion] } 
          : section
      )
    }));
  };

  const handleQuestionChange = (
    sectionId: string, 
    questionId: string, 
    field: string, 
    value: string | number
  ) => {
    setQuizData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              questions: section.questions.map(question => 
                question.id === questionId 
                  ? { ...question, [field]: value } 
                  : question
              ) 
            } 
          : section
      )
    }));
  };

  const handleOptionChange = (
    sectionId: string, 
    questionId: string, 
    optionId: string, 
    field: string, 
    value: string | boolean
  ) => {
    setQuizData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              questions: section.questions.map(question => 
                question.id === questionId 
                  ? { 
                      ...question, 
                      options: question.options.map(option => 
                        option.id === optionId 
                          ? { ...option, [field]: value } 
                          : field === 'isCorrect' && value === true 
                            ? { ...option, isCorrect: false } 
                            : option
                      ) 
                    } 
                  : question
              ) 
            } 
          : section
      )
    }));
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    setQuizData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              questions: section.questions.filter(question => question.id !== questionId) 
            } 
          : section
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!quizData.title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title is required",
        variant: "destructive"
      });
      return;
    }

    if (quizData.sections.some(section => !section.title.trim())) {
      toast({
        title: "Error",
        description: "All sections must have titles",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would be a call to the backend
    toast({
      title: "Success",
      description: editMode 
        ? "Quiz updated successfully" 
        : "Quiz created successfully"
    });
    
    navigate('/admin/quizzes');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin/quizzes')} 
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {editMode ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
        </div>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed" 
          onClick={handleSubmit}
        >
          <Save className="h-4 w-4 mr-2" /> 
          {editMode ? 'Update Quiz' : 'Create Quiz'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quiz Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>
              Basic information about the quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={quizData.title}
                  onChange={handleQuizChange}
                  placeholder="e.g., Midterm Exam"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Quiz Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={quizData.code}
                  onChange={handleQuizChange}
                  placeholder="arena-xxxx"
                  required
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                name="instructions"
                value={quizData.instructions}
                onChange={handleQuizChange}
                placeholder="Enter instructions for students..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min={1}
                  value={quizData.duration}
                  onChange={handleQuizChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDateTime">Start Date & Time</Label>
                <Input
                  id="startDateTime"
                  name="startDateTime"
                  type="datetime-local"
                  value={quizData.startDateTime}
                  onChange={handleQuizChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDateTime">End Date & Time</Label>
                <Input
                  id="endDateTime"
                  name="endDateTime"
                  type="datetime-local"
                  value={quizData.endDateTime}
                  onChange={handleQuizChange}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {quizData.sections.map((section, sectionIndex) => (
          <Card key={section.id} className="border-l-4 border-l-arena-red">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">
                  Section {sectionIndex + 1}
                </CardTitle>
                <CardDescription>
                  Create questions for this section
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {quizData.sections.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(section.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {sectionIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Move section up
                      const newSections = [...quizData.sections];
                      [newSections[sectionIndex], newSections[sectionIndex - 1]] = 
                        [newSections[sectionIndex - 1], newSections[sectionIndex]];
                      setQuizData(prev => ({ ...prev, sections: newSections }));
                    }}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                )}
                {sectionIndex < quizData.sections.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Move section down
                      const newSections = [...quizData.sections];
                      [newSections[sectionIndex], newSections[sectionIndex + 1]] = 
                        [newSections[sectionIndex + 1], newSections[sectionIndex]];
                      setQuizData(prev => ({ ...prev, sections: newSections }));
                    }}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`section-${section.id}-title`}>Section Title</Label>
                <Input
                  id={`section-${section.id}-title`}
                  value={section.title}
                  onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                  placeholder="e.g., Multiple Choice Questions"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`section-${section.id}-instructions`}>Section Instructions</Label>
                <Textarea
                  id={`section-${section.id}-instructions`}
                  value={section.instructions}
                  onChange={(e) => handleSectionChange(section.id, 'instructions', e.target.value)}
                  placeholder="Instructions for this section..."
                  rows={2}
                />
              </div>

              {/* Questions */}
              {section.questions.map((question, qIndex) => (
                <Card key={question.id} className="border border-gray-200 shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-base">
                      Question {qIndex + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(section.id, question.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${question.id}-text`}>Question Text</Label>
                      <Textarea
                        id={`question-${question.id}-text`}
                        value={question.text}
                        onChange={(e) => handleQuestionChange(
                          section.id, 
                          question.id, 
                          'text', 
                          e.target.value
                        )}
                        placeholder="Enter your question here..."
                        rows={2}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="text-sm"
                        onClick={() => {
                          // Handle image upload
                          alert('Image upload would be implemented in a real app');
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" /> Add Image
                      </Button>
                      {question.imageUrl && (
                        <div className="flex-1 text-sm text-gray-500">
                          Image: {question.imageUrl.split('/').pop()}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Label>Options</Label>
                      {question.options.map((option, oIndex) => (
                        <div key={option.id} className="flex items-start space-x-2">
                          <input
                            type="radio"
                            id={`option-${option.id}-correct`}
                            name={`question-${question.id}-correct`}
                            checked={option.isCorrect}
                            onChange={() => handleOptionChange(
                              section.id,
                              question.id,
                              option.id,
                              'isCorrect',
                              true
                            )}
                            className="mt-2"
                          />
                          <div className="flex-1">
                            <Input
                              value={option.text}
                              onChange={(e) => handleOptionChange(
                                section.id,
                                question.id,
                                option.id,
                                'text',
                                e.target.value
                              )}
                              placeholder={`Option ${oIndex + 1}`}
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`question-${question.id}-correct`}>
                          Marks for Correct
                        </Label>
                        <Input
                          id={`question-${question.id}-correct`}
                          type="number"
                          value={question.marksForCorrect}
                          onChange={(e) => handleQuestionChange(
                            section.id,
                            question.id,
                            'marksForCorrect',
                            Number(e.target.value)
                          )}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`question-${question.id}-wrong`}>
                          Marks for Wrong
                        </Label>
                        <Input
                          id={`question-${question.id}-wrong`}
                          type="number"
                          value={question.marksForWrong}
                          onChange={(e) => handleQuestionChange(
                            section.id,
                            question.id,
                            'marksForWrong',
                            Number(e.target.value)
                          )}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`question-${question.id}-unattempted`}>
                          Marks for Unattempted
                        </Label>
                        <Input
                          id={`question-${question.id}-unattempted`}
                          type="number"
                          value={question.marksForUnattempted}
                          onChange={(e) => handleQuestionChange(
                            section.id,
                            question.id,
                            'marksForUnattempted',
                            Number(e.target.value)
                          )}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => addQuestion(section.id)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addSection}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Section
        </Button>
      </form>
    </div>
  );
};

export default QuizForm;
