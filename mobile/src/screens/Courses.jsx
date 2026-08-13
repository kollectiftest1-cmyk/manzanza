import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Text, View, StyleSheet } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { api } from '../api/services'
import { API_ORIGIN } from '../api/client'
import { Badge, Button, Card, Empty, ErrorBox, Field, FormModal, Screen, nameOf } from '../components/UI'
import { theme } from '../theme'

export default function Courses({ user, open }) {
  const [items,setItems]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState('')
  const load=useCallback(async()=>{setLoading(true);setError('');try{setItems(await api.courses.list())}catch(e){setError(e.message)}finally{setLoading(false)}},[])
  useEffect(()=>{load()},[load])
  return <Screen title="Mes cours" subtitle={`${items.length} cours`} refreshing={loading} onRefresh={load}><ErrorBox error={error} onRetry={load}/>{items.map(c=><Card key={c.id} onPress={()=>open('course',{course:c})}><View style={s.line}><View style={s.grow}><Text style={s.title}>{nameOf(c)}</Text><Text style={s.meta}>{c.code || c.auditoire_name || c.auditoire?.nom || 'Cours académique'}</Text></View><Text style={s.arrow}>›</Text></View></Card>)}{!items.length&&!loading&&<Empty/>}</Screen>
}

export function CourseDetail({ user, route, back }) {
  const id=route.course.id,[course,setCourse]=useState(route.course),[materials,setMaterials]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[modal,setModal]=useState(false)
  const [form,setForm]=useState({title:'',description:'',material_type:'document',url:'',file:null})
  const teacher=user.role==='enseignant'
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [c,m]=await Promise.all([api.courses.detail(id),api.courses.materials(id)]);setCourse(c);setMaterials(m)}catch(e){setError(e.message)}finally{setLoading(false)}},[id])
  useEffect(()=>{load()},[load])
  const pick=async()=>{const r=await DocumentPicker.getDocumentAsync({copyToCacheDirectory:true});if(!r.canceled)setForm(v=>({...v,file:r.assets[0],title:v.title||r.assets[0].name}))}
  const save=async()=>{try{setLoading(true);await api.courses.createMaterial({...form,course:id});setModal(false);setForm({title:'',description:'',material_type:'document',url:'',file:null});await load()}catch(e){Alert.alert('Erreur',e.message)}finally{setLoading(false)}}
  const remove=id=>Alert.alert('Supprimer','Supprimer ce support ?',[{text:'Annuler'},{text:'Supprimer',style:'destructive',onPress:async()=>{try{await api.courses.deleteMaterial(id);load()}catch(e){Alert.alert('Erreur',e.message)}}}])
  const openFile=value=>{if(!value)return;const url=value.startsWith('http')?value:`${API_ORIGIN}${value}`;Linking.openURL(url)}
  return <><Screen title={nameOf(course)} subtitle={course.code} back={back} refreshing={loading} onRefresh={load} right={teacher?<Button small title="Ajouter" onPress={()=>setModal(true)}/>:null}><ErrorBox error={error} onRetry={load}/><Card><Text style={s.description}>{course.description||'Aucune description.'}</Text><Text style={s.meta}>Titulaire : {course.titulaire_name||course.teacher_name||'Non précisé'}</Text><Text style={s.meta}>Auditoire : {course.auditoire_name||course.auditoire?.nom||'Non précisé'}</Text></Card><Text style={s.heading}>Supports de cours</Text>{materials.map(m=><Card key={m.id}><Text style={s.title}>{m.title}</Text><Text style={s.meta}>{m.description||m.material_type}</Text><View style={s.actions}>{(m.file||m.url)&&<Button small title="Ouvrir" variant="secondary" onPress={()=>openFile(m.file||m.url)}/>} {teacher&&<Button small title="Supprimer" variant="danger" onPress={()=>remove(m.id)}/>}</View></Card>)}{!materials.length&&<Empty>Aucun support publié.</Empty>}</Screen><FormModal visible={modal} title="Nouveau support" onClose={()=>setModal(false)} onSubmit={save} loading={loading}><Field label="Titre" value={form.title} onChangeText={title=>setForm(v=>({...v,title}))}/><Field label="Description" multiline value={form.description} onChangeText={description=>setForm(v=>({...v,description}))}/><Field label="Lien externe (facultatif)" value={form.url} onChangeText={url=>setForm(v=>({...v,url}))}/><Button title={form.file?`Fichier : ${form.file.name}`:'Choisir un fichier'} variant="secondary" onPress={pick}/></FormModal></>
}
const s=StyleSheet.create({line:{flexDirection:'row',alignItems:'center'},grow:{flex:1},title:{fontSize:16,fontWeight:'800',color:theme.colors.text},meta:{color:theme.colors.muted,marginTop:5},arrow:{fontSize:30,color:theme.colors.primary},description:{fontSize:15,color:theme.colors.text,lineHeight:22,marginBottom:12},heading:{fontSize:19,fontWeight:'800',color:theme.colors.text,marginVertical:12},actions:{flexDirection:'row',gap:8,marginTop:13}})
