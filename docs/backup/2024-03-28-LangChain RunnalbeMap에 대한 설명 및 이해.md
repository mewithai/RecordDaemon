---
title: "LangChain RunnalbeMap에 대한 설명 및 이해"
last_modified_at: 2024-03-24 13:00:00 
excerpt: "RunnableMap에 대해서 설명하고 예시를 정리하자."
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
permalink: /langchain/LangChain-RunnableMap/
---

## 배경 및 목적

- `deeplearning.ai`에서 학습 중에 아래의 Code에 대해서 의문이 들었다.
- `RunnableMap`은 뭐하는 애일까?

### 목적

- `RunnableMap`에 대해서 완벽하게 이해하기

## RunnableMap

> LangChain's RunnableMap is a feature that enables `the execution of multiple Runnable instances in parallel`, returning their outputs in a map structure. This is particularly useful when you need to handle different tasks concurrently and aggregate their results. For example, you could have separate chains for generating a joke and a poem based on the same topic, and then execute them together using a RunnableMap. The results are returned in a structured map, where each key corresponds to a specific task and its output.

- 목적: `the execution of multiple Runnable instances in parallel`
  - to handle different tasks concurrently and aggregate(통합) their results
- 결과물: `outputs in a map structure`

### Code

```python
chain = RunnableMap({
    "context": lambda x: retriever.get_relevant_documents(x["question"]),
    "question": lambda x: x["question"]
}) | prompt | model | output_parser
```

위 코드에서는 `context`와 `question`을 만들기 위해서 2개의 `lambda` 함수를 동시에 돌렸다. 두번째 `lambda x: x["question"]` 함수는 그냥 있는 그대로를 Return하기 때문에 필요없어 보이지만, 만약 `question`을 어떠한 방식으로 가공해서 넘겨줘야 한다면 필요하다.

### Return 결과

예시에서는 `RunnableLambda` 가 들어있는 map 형태로 Return된다.

```python
{
  context: RunnableLambda(...),
  question: RunnableLambda(...)
}
```

Chain으로 넘어가는 결과는 다음과 같다.

```python
{'context': [
             Document(page_content='harrison worked at kensho'),
             Document(page_content='bears like to eat honey')
            ],
 'question': 'where did harrison work?'}
```

## RunnableMap을 사용하는 목적

### Parallel Processing

> The primary advantage of using something like RunnableMap is to specify that certain operations can be done in parallel or at least defined in a way that they are conceptually separate. This is particularly useful when the operations are independent of each other. In your example, extracting the "context" and passing the "question" through might not depend on each other, allowing for:

- Parallel Execution
- Clarity and Separation of Concerns: 두개가 서로 관계가 없어서 따로따로 해야하는데, 이렇게 한방에 처리하면 나중에 봤을때 좀 더 이해하기가 쉽다. 

### Synchronous Execution with Organized Data Flow

> if the operations within RunnableMap are executed synchronously, the role of RunnableMap might be more about organizing the data flow in a structured way rather than about parallel execution.

동시에 병렬실행보다는 데이터를 함께 조합한다는 의미가 크다.

- Each part of the input is handled appropriately
- Data is prepared for `subsequent steps`

### 기타 이유

- Framework or Library Requirements
  - 그냥 LangChain의 Prompt를 만들때 각 인풋이 각각의 프로세싱이 필요하다면 그냥 `RunnableMap`을 쓴다라고 생각하자.
- Flexibility
  - It allows for easy modification of the pipeline.
- Readability and Maintainability

## 참고 자료

- ChatGPT답변 : [About RunnableMap]({{ site.url }}{{ site.baseurl }}/assets/files/Pipeline_Model_Transformation.md)

## 결론 및 NextStep

- RunnableMap에 대해서 알아보았다. 코드가 눈에 익지 않는데 최대한 많이 봐서 눈에 익히자.
  - 생각을 버리고 `Framework or Library Requirements`로 생각하자.

### NextStep

- `LCELL`이랑 친해지기