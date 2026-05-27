import { defineStore } from 'pinia'
import localApiClient from '@/services/localApiClient'

export interface Topic {
  id: string
  title: string
  author: string
  content: string
  createdAt: string
}

export interface Reply {
  id: string
  topicId: string
  author: string
  content: string
  createdAt: string
}

export interface CommunityComment {
  id: string
  title: string
  author: string
  content: string
}

export const useForumStore = defineStore('forum', {
  state: () => ({
    topics: [] as Topic[],
    currentTopic: null as Topic | null,
    replies: [] as Reply[],
    loading: false,
  }),

  actions: {
    async fetchTopics() {
      this.loading = true
      try {
        const response = await localApiClient.get('/topics')
        this.topics = response.data.sort((a: Topic, b: Topic) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      } catch (error) {
        console.error('Error fetching topics:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchTopicById(id: string) {
      this.loading = true
      try {
        const response = await localApiClient.get(`/topics/${id}`)
        this.currentTopic = response.data
        await this.fetchReplies(id)
      } catch (error) {
        console.error('Error fetching topic:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchReplies(topicId: string) {
      try {
        const response = await localApiClient.get(`/replies?topicId=${topicId}`)
        this.replies = response.data
      } catch (error) {
        console.error('Error fetching replies:', error)
      }
    },

    async createTopic(topic: Omit<Topic, 'id' | 'createdAt'>) {
      const newTopic = {
        ...topic,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      }
      try {
        const response = await localApiClient.post('/topics', newTopic)
        this.topics.unshift(response.data)
        return response.data
      } catch (error) {
        console.error('Error creating topic:', error)
      }
    },

    async addReply(reply: Omit<Reply, 'id' | 'createdAt'>) {
      const newReply = {
        ...reply,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      }
      try {
        const response = await localApiClient.post('/replies', newReply)
        this.replies.push(response.data)
      } catch (error) {
        console.error('Error adding reply:', error)
      }
    },

    async fetchLatestComments(limit = 3): Promise<CommunityComment[]> {
      try {
        const response = await localApiClient.get('/topics')
        const data = response.data as Topic[]
        return data
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
          .map((topic) => ({
            id: topic.id,
            title: topic.title,
            author: topic.author,
            content: topic.content,
          }))
      } catch (error) {
        console.error('Error fetching latest comments:', error)
        return []
      }
    },
  },
})
