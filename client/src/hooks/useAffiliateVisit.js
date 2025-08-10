// client/src/hooks/useAffiliateVisit.js
import { useEffect } from 'react'
import axios from 'axios'

export function useAffiliateVisit() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (!ref) return

    // only hit once per session
    if (sessionStorage.getItem('aff_visited')) return
    sessionStorage.setItem('aff_visited', '1')

    axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/affiliate/visit`,
      { affiliateCode: ref.toUpperCase() }
    ).catch(() => {/* swallow errors */})
  }, [])
}
