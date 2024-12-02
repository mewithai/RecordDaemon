---
title: "[LangChain] Understanding the Role and Functionality of Agents"
excerpt: "LangChain에서 Agent의 역활을 이해한다."
toc: true
toc_sticky: true
toc_label: "Agent and his tools"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
permalink: /langchain/agent-and-tools/
---

## 배경과 목표

LangChain에서 Agent의 역활을 이해한다.

## LangChain에서 Agent란?

 LLM이 스스로 뭘 할지를 결정해서 일렬의 작업을 수행하는 것, 이전에는 코드로 뭘할지를 정해줘야 했지만 이제는 주어진 말을 이해하고 Agent는 자기가 판단해서 적당한 능력을 쓰고 결과를 알려준다.

> In LangChain, an agent is a component designed to dynamically determine and execute actions based on context, rather than relying on hardcoded sequences. These agents use language models to process information, make decisions, and interact with various tools to perform tasks. They are central to creating flexible, intelligent systems that can handle a wide range of activities, from simple data retrieval to complex problem-solving, by leveraging natural language understanding and generation capabilities.

## ReAct: Reasoning and Acting in Language Models

이렇게 LLM이 판단하려면 추론 능력이 있어야하는데 이걸 `Reasion`이라하고 그 후 행동을 `Action`이라고 하고 합쳐서 `ReAct`라고 한다.

Reasion을 어떤 근거로 하는지에 따라서 `Zero-shot ReAct`, `Conversational ReAct`, `ReAct Docstore`, `Self-ask with Search` 등으로 나눌 수 있다.
자세한 설명은 생략하고 다음의 글을 읽어보자. [LangChain Cook book](https://www.pinecone.io/learn/series/langchain/langchain-agents/)

추론은 어떤 Tool을 사용할지에 대한 결정이다.

예를 들어서 `+`라는 툴을 알려주고 `1+1=?`을 하라고 했을 때 더하기라는 툴을 쓸지 말지에 대한 결정

### Agent Types

Agent Type의 종류는 다음의 문서에서 확인할 수 있다. 

[Agent Types](https://api.python.langchain.com/en/latest/agents/langchain.agents.agent_types.AgentType.html)

다음은 Type에 대한 정리

- ZERO_SHOT_REACT_DESCRIPTION
  - 추론을 하는데 그냥 아무것도 없이 생각함. 그냥 생각
- REACT_DOCSTORE
  - This agent has access to a document store that allows it to look up relevant information to answering the question.
- SELF_ASK_WITH_SEARCH
  - This agent uses a search tool to look up answers to the simpler questions in order to answer the original complex question.
  - 원래의 복잡한 질문을 단순화 하기 위해서 연구해보고 질문을 다시 정리
- CONVERSATIONAL_REACT_DESCRIPTION
  - 대화한 내용에서 추론
- CHAT_ZERO_SHOT_REACT_DESCRIPTION
- CHAT_CONVERSATIONAL_REACT_DESCRIPTION
- STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION
  - An zero-shot react agent optimized for chat models.
  - `This agent is capable of invoking tools that have multiple inputs.`  -> **이해안됨**
- OPENAI_FUNCTIONS
- OPENAI_MULTI_FUNCTIONS

## 결론 and Next Step

LagChain에서 Agent를 만들고 거기에 능력(Tools)을 주면 LLM 추론해서 일을 진행한다.

Tool은 Code가 될 수 있으니까 기존의 Code로 충분히 구현이 가능하다.

### Next Step

- LangChain Agent Tool을 공부하고 직접 만들어 볼 것 : [완료]()
  - DB조회를 통해서 판단하고 Action을 이끌어 낼 것