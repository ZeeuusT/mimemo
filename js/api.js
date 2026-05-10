const MiMoAPI = {
  ENDPOINT: 'https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages',
  MODEL: 'mimo-v2.5-pro',

  async call(messages, options = {}) {
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      throw new Error('请先点击右上角 ⚙️ 配置 API Key');
    }

    // 转换为 Anthropic API 格式
    let systemMessage = '';
    const apiMessages = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage = msg.content;
      } else {
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    const body = {
      model: this.MODEL,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      top_p: 0.95,
      messages: apiMessages,
      thinking: { type: 'disabled' }
    };
    if (systemMessage) {
      body.system = systemMessage;
    }

    const response = await fetch(this.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === 'text');
    if (textBlock?.text) return textBlock.text;
    const thinkingBlock = data.content?.find(b => b.type === 'thinking');
    if (thinkingBlock?.thinking) return thinkingBlock.thinking;
    return '';
  },

  async summarize(content) {
    const messages = [
      {
        role: 'system',
        content: '你是一个笔记摘要助手。请用简洁的中文总结以下笔记内容的要点，不超过3句话。'
      },
      {
        role: 'user',
        content: `请总结以下笔记：\n\n${content}`
      }
    ];
    return this.call(messages, { maxTokens: 256 });
  },

  async extractTags(content) {
    const messages = [
      {
        role: 'system',
        content: '你是一个标签提取助手。请从以下笔记内容中提取3-5个关键标签词，用JSON数组格式返回，例如 ["标签1","标签2","标签3"]。只返回JSON数组，不要其他内容。'
      },
      {
        role: 'user',
        content: `请提取标签：\n\n${content}`
      }
    ];
    const result = await this.call(messages, { maxTokens: 128 });
    try {
      const match = result.match(/\[[\s\S]*?\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return [];
    } catch {
      return [];
    }
  }
};
