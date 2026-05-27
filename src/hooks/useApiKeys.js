import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { encryptKey, decryptKey } from '../lib/crypto'

export function useApiKeys(userId) {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchKeys = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error) setKeys(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  async function addKey({ name, service, keyValue, description, projectIds }) {
    const key_encrypted = encryptKey(keyValue, userId)
    const { data, error } = await supabase.from('api_keys').insert({
      user_id: userId,
      name,
      service,
      key_encrypted,
      description,
      project_ids: projectIds || [],
    }).select().single()
    if (error) throw error
    setKeys(prev => [data, ...prev])
    return data
  }

  async function updateKey(id, updates) {
    const payload = { ...updates }
    if (updates.keyValue) {
      payload.key_encrypted = encryptKey(updates.keyValue, userId)
      delete payload.keyValue
    }
    const { data, error } = await supabase
      .from('api_keys').update(payload).eq('id', id).select().single()
    if (error) throw error
    setKeys(prev => prev.map(k => k.id === id ? data : k))
    return data
  }

  async function deleteKey(id) {
    const { error } = await supabase.from('api_keys').delete().eq('id', id)
    if (error) throw error
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  async function incrementUsage(id) {
    const key = keys.find(k => k.id === id)
    if (!key) return
    await supabase.from('api_keys')
      .update({ usage_count: (key.usage_count || 0) + 1 })
      .eq('id', id)
    setKeys(prev => prev.map(k => k.id === id ? { ...k, usage_count: (k.usage_count || 0) + 1 } : k))
  }

  function getDecryptedKey(keyObj) {
    return decryptKey(keyObj.key_encrypted, userId)
  }

  return { keys, loading, addKey, updateKey, deleteKey, incrementUsage, getDecryptedKey, refetch: fetchKeys }
}
