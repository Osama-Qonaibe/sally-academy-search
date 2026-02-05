# Configuration Guide

This guide covers the optional features and their configuration in Sally.

## Table of Contents

- [Chat History Storage](#chat-history-storage)
- [Search Providers](#search-providers)
- [Additional AI Providers](#additional-ai-providers)
- [Other Features](#other-features)

## Chat History Storage

### Using Supabase (Recommended for production)

1. Create a project at [Supabase Console](https://supabase.com/dashboard)
2. Set up your database tables (see schema in project)
3. Configure your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

## Search Providers

### Tavily Configuration

```bash
TAVILY_API_KEY=[YOUR_API_KEY]
```

### SearXNG Configuration

SearXNG can be used as an alternative search backend with advanced search capabilities.

#### Basic Setup

1. Set up SearXNG as your search provider:

```bash
SEARCH_API=searxng
SEARXNG_API_URL=http://localhost:8080
SEARXNG_SECRET=""  # generate with: openssl rand -base64 32
```

#### Docker Setup

1. Ensure you have Docker and Docker Compose installed
2. Two configuration files are provided in the root directory:
   - `searxng-settings.yml`: Contains main configuration for SearXNG
   - `searxng-limiter.toml`: Configures rate limiting and bot detection

#### Advanced Configuration

1. Configure environment variables in your `.env.local`:

```bash
# SearXNG Base Configuration
SEARXNG_PORT=8080
SEARXNG_BIND_ADDRESS=0.0.0.0
SEARXNG_IMAGE_PROXY=true

# Search Behavior
SEARXNG_DEFAULT_DEPTH=basic  # Set to 'basic' or 'advanced'
SEARXNG_MAX_RESULTS=50  # Maximum number of results to return
SEARXNG_ENGINES=google,bing,duckduckgo,wikipedia  # Comma-separated list of search engines
SEARXNG_TIME_RANGE=None  # Time range: day, week, month, year, or None
SEARXNG_SAFESEARCH=0  # 0: off, 1: moderate, 2: strict

# Rate Limiting
SEARXNG_LIMITER=false  # Enable to limit requests per IP
```

#### Advanced Search Features

- `SEARXNG_DEFAULT_DEPTH`: Controls search depth
  - `basic`: Standard search
  - `advanced`: Includes content crawling and relevance scoring
- `SEARXNG_MAX_RESULTS`: Maximum results to return
- `SEARXNG_CRAWL_MULTIPLIER`: In advanced mode, determines how many results to crawl

#### Customizing SearXNG

You can modify `searxng-settings.yml` to:

- Enable/disable specific search engines
- Change UI settings
- Adjust server options

For detailed configuration options, refer to the [SearXNG documentation](https://docs.searxng.org/admin/settings/settings.html#settings-yml)

#### Troubleshooting

- If specific search engines aren't working, try disabling them in `searxng-settings.yml`
- For rate limiting issues, adjust settings in `searxng-limiter.toml`
- Check Docker logs for potential configuration errors:

```bash
docker-compose logs searxng
```

## Additional AI Providers

Models are configured in `public/config/models.json`. Each model requires its corresponding API key to be set in the environment variables.

> **Note:** Ollama models are discovered dynamically at runtime when an Ollama server is available. Only models that expose the `tools` capability will appear in Sally.

### Model Configuration

The `models.json` file contains an array of model configurations with the following structure:

```json
{
  "models": [
    {
      "id": "model-id",
      "name": "Model Name",
      "provider": "Provider Name",
      "providerId": "provider-id",
      "enabled": true,
      "toolCallType": "native|manual",
      "toolCallModel": "tool-call-model-id"
    }
  ]
}
```

### Provider API Keys

### Google Generative AI

```bash
GOOGLE_GENERATIVE_AI_API_KEY=[YOUR_API_KEY]
```

### Anthropic

```bash
ANTHROPIC_API_KEY=[YOUR_API_KEY]
```

### Groq

```bash
GROQ_API_KEY=[YOUR_API_KEY]
```

### Ollama

```bash
OLLAMA_BASE_URL=http://localhost:11434
```

When this variable is set, Sally will automatically discover Ollama models that advertise the `tools` capability.

### Azure OpenAI

```bash
AZURE_API_KEY=[YOUR_API_KEY]
AZURE_RESOURCE_NAME=[YOUR_RESOURCE_NAME]
```

### DeepSeek

```bash
DEEPSEEK_API_KEY=[YOUR_API_KEY]
```

### Fireworks

```bash
FIREWORKS_API_KEY=[YOUR_API_KEY]
```

### xAI

```bash
XAI_API_KEY=[YOUR_XAI_API_KEY]
```

### OpenAI Compatible Model

```bash
OPENAI_COMPATIBLE_API_KEY=[YOUR_API_KEY]
OPENAI_COMPATIBLE_API_BASE_URL=[YOUR_API_BASE_URL]
```

## Other Features

### Share Feature

```bash
NEXT_PUBLIC_ENABLE_SHARE=true
```

### Video Search

```bash
SERPER_API_KEY=[YOUR_API_KEY]
```

### Alternative Retrieve Tool

```bash
JINA_API_KEY=[YOUR_API_KEY]
```
