import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Clock, 
  TrendingUp, 
  User, 
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Link,
  Users
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  difficulty: string;
  assignee: string;
  status: 'todo' | 'inProgress' | 'done';
  completedDate?: string;
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Optimiser les balises title",
    description: "Mettre à jour les balises title pour les pages importantes",
    category: "technique",
    impact: "+10 pts",
    difficulty: "Moyen",
    assignee: "David Spade",
    status: "todo"
  },
  {
    id: "2",
    title: "Améliorer le maillage interne",
    description: "Créer des liens internes pertinents entre les pages",
    category: "contenu",
    impact: "+8 pts",
    difficulty: "Facile",
    assignee: "Sarah Johnson",
    status: "inProgress"
  },
  {
    id: "3",
    title: "Optimiser le contenu pour les mots-clés cibles",
    description: "Effectuer une recherche de mots-clés et optimiser le contenu en conséquence",
    category: "contenu",
    impact: "+12 pts",
    difficulty: "Difficile",
    assignee: "Mike Chen",
    status: "done",
    completedDate: "2024-03-10"
  },
  {
    id: "4",
    title: "Ajouter des données structurées",
    description: "Implémenter des données structurées pour améliorer la visibilité dans les moteurs de recherche",
    category: "technique",
    impact: "+15 pts",
    difficulty: "Moyen",
    assignee: "Lisa Anderson",
    status: "todo"
  },
  {
    id: "5",
    title: "Travailler le E-E-A-T",
    description: "Améliorer l'expertise, l'expérience, l'autorité et la confiance du site web",
    category: "eeat",
    impact: "+20 pts",
    difficulty: "Difficile",
    assignee: "David Spade",
    status: "inProgress"
  },
  {
    id: "6",
    title: "Optimiser la vitesse du site",
    description: "Réduire le temps de chargement des pages pour améliorer l'expérience utilisateur",
    category: "performance",
    impact: "+10 pts",
    difficulty: "Moyen",
    assignee: "Sarah Johnson",
    status: "done",
    completedDate: "2024-03-05"
  }
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'status' | 'completedDate'>>({
    title: '',
    description: '',
    category: '',
    impact: '',
    difficulty: '',
    assignee: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTaskWithId: Task = {
      ...newTask,
      id: Math.random().toString(36).substring(7),
      status: 'todo'
    } as Task;
    setTasks([...tasks, newTaskWithId]);
    setIsDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      category: '',
      impact: '',
      difficulty: '',
      assignee: ''
    });
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        return { 
          ...task, 
          status: status,
          completedDate: status === 'done' ? new Date().toLocaleDateString() : task.completedDate
        };
      }
      return task;
    }));
  };

  const getTotalTasks = () => {
    return tasks.length;
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recommandations & Tâches</h1>
          <p className="text-gray-600 mt-1">Système de suivi Kanban pour l'optimisation SEO</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Rechercher une tâche..." 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle recommandation SEO à traiter
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input 
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Ex: Optimiser les méta descriptions"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={newTask.category} onValueChange={(value) => setNewTask({...newTask, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technique">Technique</SelectItem>
                        <SelectItem value="contenu">Contenu</SelectItem>
                        <SelectItem value="eeat">E-E-A-T</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Décrivez la tâche en détail..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="impact">Impact estimé</Label>
                    <Input 
                      id="impact"
                      value={newTask.impact}
                      onChange={(e) => setNewTask({...newTask, impact: e.target.value})}
                      placeholder="Ex: +15 pts"
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulté</Label>
                    <Select value={newTask.difficulty} onValueChange={(value) => setNewTask({...newTask, difficulty: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Facile">Facile</SelectItem>
                        <SelectItem value="Moyen">Moyen</SelectItem>
                        <SelectItem value="Difficile">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignee">Assigné à</Label>
                    <Select value={newTask.assignee} onValueChange={(value) => setNewTask({...newTask, assignee: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="David Spade">David Spade</SelectItem>
                        <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                        <SelectItem value="Mike Chen">Mike Chen</SelectItem>
                        <SelectItem value="Lisa Anderson">Lisa Anderson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Créer la tâche
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{getTotalTasks()}</div>
                <div className="text-sm text-gray-600">Total tâches</div>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{tasks.filter(t => t.status === 'todo').length}</div>
                <div className="text-sm text-gray-600">À implémenter</div>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'inProgress').length}</div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'done').length}</div>
                <div className="text-sm text-gray-600">Terminées</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* À implémenter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              À implémenter ({tasks.filter(t => t.status === 'todo').length})
            </h2>
          </div>
          
          <div className="space-y-3">
            {filteredTasks.filter(task => task.status === 'todo').map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={task.difficulty === 'Facile' ? 'secondary' : task.difficulty === 'Moyen' ? 'default' : 'destructive'} 
                        className="text-xs"
                      >
                        {task.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {task.impact}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateTaskStatus(task.id, 'inProgress')}
                    >
                      Démarrer
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* En cours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              En cours ({tasks.filter(t => t.status === 'inProgress').length})
            </h2>
          </div>
          
          <div className="space-y-3">
            {filteredTasks.filter(task => task.status === 'inProgress').map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={task.difficulty === 'Facile' ? 'secondary' : task.difficulty === 'Moyen' ? 'default' : 'destructive'} 
                        className="text-xs"
                      >
                        {task.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {task.impact}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateTaskStatus(task.id, 'todo')}
                    >
                      Retour
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateTaskStatus(task.id, 'done')}
                    >
                      Terminer
                      <CheckCircle className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Terminé */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Terminées ({tasks.filter(t => t.status === 'done').length})
            </h2>
          </div>
          
          <div className="space-y-3">
            {filteredTasks.filter(task => task.status === 'done').map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={task.difficulty === 'Facile' ? 'secondary' : task.difficulty === 'Moyen' ? 'default' : 'destructive'} 
                        className="text-xs"
                      >
                        {task.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {task.impact}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                  </div>
                  
                  {task.completedDate && (
                    <div className="text-xs text-green-600 font-medium">
                      Terminé le {task.completedDate}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
