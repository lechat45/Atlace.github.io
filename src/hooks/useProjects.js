import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects(userId) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (!error) setProjects(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  async function createProject(payload) {
    // Map camelCase form fields → snake_case DB columns
    const { apiKeyIds, mainLanguage, externalUrl, notes, ...rest } = payload
    const { data, error } = await supabase.from('projects').insert({
      ...rest,
      user_id: userId,
      status: 'active',
      api_key_ids: apiKeyIds || [],
      main_language: mainLanguage || 'HTML/JS/CSS',
      external_url: externalUrl || null,
    }).select().single()
    if (error) throw error
    setProjects(prev => [data, ...prev])
    return data
  }

  async function updateProject(id, updates) {
    const { data, error } = await supabase
      .from('projects').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    setProjects(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  async function deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function archiveProject(id) {
    return updateProject(id, { status: 'archived' })
  }

  async function getProjectFiles(projectId) {
    const { data, error } = await supabase
      .from('project_files').select('*')
      .eq('project_id', projectId)
      .order('created_at')
    if (error) throw error
    return data || []
  }

  async function saveFile(projectId, { filename, language, content, fileId }) {
    if (fileId) {
      const { data, error } = await supabase.from('project_files')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', fileId).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('project_files').insert({
      project_id: projectId, filename, language, content,
    }).select().single()
    if (error) throw error
    return data
  }

  async function deleteFile(fileId) {
    const { error } = await supabase.from('project_files').delete().eq('id', fileId)
    if (error) throw error
  }

  return {
    projects, loading, createProject, updateProject, deleteProject, archiveProject,
    getProjectFiles, saveFile, deleteFile, refetch: fetchProjects,
  }
}
