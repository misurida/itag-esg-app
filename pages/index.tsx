import { Box } from '@mantine/core'
import type { NextPage } from 'next'
import AnnotationsEditor from '../components/annotations/AnnotationsEditor'
import MainLayout from '../components/structure/MainLayout'

const Home: NextPage = () => {
  return (
    <MainLayout>
      <AnnotationsEditor />
    </MainLayout>
  )
}

export default Home
