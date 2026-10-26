import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as NavigationBar from 'expo-navigation-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import LoginScreen from './src/screens/LoginScreen'
import Dashboard from './src/screens/Dashboard'
import { login, restoreSession } from './src/api/client'
import { theme } from './src/theme'

function Root() {
  const [user,setUser]=useState(null),[ready,setReady]=useState(false)
  useEffect(()=>{restoreSession().then(saved=>{if(['etudiant','enseignant'].includes(saved?.role))setUser(saved)}).finally(()=>setReady(true))},[])
  useEffect(()=>{if(Platform.OS==='android')NavigationBar.setButtonStyleAsync('dark').catch(()=>{})},[])
  if(!ready)return <SafeAreaView edges={['top','bottom']} style={styles.loading}><StatusBar style="light" backgroundColor={theme.colors.navy}/><ActivityIndicator color="#fff" size="large"/><View style={styles.loadingLine}/></SafeAreaView>
  return <View style={styles.root}><StatusBar style={user?'dark':'light'} backgroundColor={user?'#FFFFFF':theme.colors.navy}/>{user?<Dashboard initialUser={user} onSessionEnd={()=>setUser(null)}/>:<LoginScreen onLogin={async(email,password)=>setUser(await login(email,password))}/>}</View>
}
export default function App(){return <SafeAreaProvider><Root/></SafeAreaProvider>}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:theme.colors.background},loading:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:theme.colors.navy},loadingLine:{width:64,height:4,borderRadius:2,backgroundColor:'#7FD3DC',marginTop:22}})
