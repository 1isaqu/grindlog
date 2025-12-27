import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
    LineChart, Line, ComposedChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle, TrendingUp, Trophy, Activity } from "lucide-react";
import { analyticsEngine } from '../../services/analyticsEngine';

export default function DataPage() {
    const [volumeData, setVolumeData] = useState([]);
    const [progressionData, setProgressionData] = useState([]);
    const [scatterData, setScatterData] = useState([]);
    const [topSessions, setTopSessions] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedExerciseId, setSelectedExerciseId] = useState(null);

    const exercises = useLiveQuery(() => db.exercises.toArray());

    useEffect(() => {
        const loadData = async () => {
            const vol = await analyticsEngine.getWeeklyVolumePerMuscle();
            setVolumeData(vol);

            const scatter = await analyticsEngine.getScatterData();
            setScatterData(scatter);

            const top = await analyticsEngine.getTopSessions();
            setTopSessions(top);

            const sugg = await analyticsEngine.getTrainingSuggestions();
            setSuggestions(sugg);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (selectedExerciseId) {
            analyticsEngine.getExerciseProgressionData(selectedExerciseId).then(setProgressionData);
        } else if (exercises && exercises.length > 0) {
            // Default to first exercise
            setSelectedExerciseId(exercises[0].id);
        }
    }, [selectedExerciseId, exercises]);

    return (
        <div className="p-4 space-y-6 pb-24 max-w-md mx-auto animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-primary mb-2">Análises</h1>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="space-y-2">
                    {suggestions.map((s, i) => (
                        <Alert key={i} variant={s.type === 'alert' ? 'destructive' : 'default'} className="bg-card border-l-4 border-l-primary">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Insight</AlertTitle>
                            <AlertDescription>{s.message}</AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Geral</TabsTrigger>
                    <TabsTrigger value="progression">Progresso</TabsTrigger>
                    <TabsTrigger value="analysis">Análise</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Volume Semanal</CardTitle>
                            <CardDescription>Atual vs Média de 4 Semanas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={volumeData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="muscle" type="category" width={80} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="baseline" fill="#e2e8f0" name="Base" barSize={10} radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="current" fill="#0D1B2A" name="Atual" barSize={10} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" /> Melhores Sessões
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topSessions.map((s, i) => (
                                    <div key={s.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
                                            <div>
                                                <p className="font-medium text-sm">{new Date(s.date).toLocaleDateString()}</p>
                                                <p className="text-xs text-muted-foreground">Vol: {s.volume.toLocaleString()} kg</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-primary">{Math.round(s.score)} pts</span>
                                            <p className="text-xs text-muted-foreground">RPE {s.avgRPE?.toFixed(1)}</p>
                                        </div>
                                    </div>
                                ))}
                                {topSessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum treino registrado ainda.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="progression" className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Selecionar Exercício</label>
                        <Select
                            value={selectedExerciseId ? String(selectedExerciseId) : ""}
                            onValueChange={(val) => setSelectedExerciseId(parseInt(val))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar exercício" />
                            </SelectTrigger>
                            <SelectContent>
                                {exercises?.map(e => (
                                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Evolução</CardTitle>
                            <CardDescription>Volume e Carga Máxima</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={progressionData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#0D1B2A" tick={{ fontSize: 10 }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#8884d8" tick={{ fontSize: 10 }} />
                                        <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                                        <Area yAxisId="left" type="monotone" dataKey="volume" fill="#0D1B2A" fillOpacity={0.1} stroke="#0D1B2A" name="Volume" />
                                        <Line yAxisId="right" type="monotone" dataKey="maxLoad" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} name="Carga Máxima (kg)" />
                                        <Line yAxisId="right" type="monotone" dataKey="maxReps" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} name="Repetições Máximas" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Intensidade vs Volume</CardTitle>
                            <CardDescription>Análise de Sessão</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                        <CartesianGrid />
                                        <XAxis type="number" dataKey="x" name="Volume" unit="kg" tick={{ fontSize: 10 }} />
                                        <YAxis type="number" dataKey="y" name="RPE" domain={[0, 10]} tick={{ fontSize: 10 }} />
                                        <ZAxis type="number" dataKey="z" range={[50, 50]} />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <ReferenceLine y={7} stroke="red" strokeDasharray="3 3" label={{ value: 'Alta Intensidade', position: 'insideTopRight', fontSize: 10, fill: 'red' }} />
                                        <ReferenceLine x={10000} stroke="green" strokeDasharray="3 3" label={{ value: 'Alto Volume', position: 'insideBottomRight', fontSize: 10, fill: 'green' }} />
                                        <Scatter name="Sessões" data={scatterData} fill="#0D1B2A" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground">
                                <div className="p-2 bg-muted rounded">Superior-Direita: Alto Risco de Fadiga</div>
                                <div className="p-2 bg-muted rounded">Superior-Esquerda: Foco em Volume</div>
                                <div className="p-2 bg-muted rounded">Inferior-Direita: Volume Desnecessário</div>
                                <div className="p-2 bg-muted rounded">Inferior-Esquerda: Recuperação/Fácil</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
