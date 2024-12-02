---
last_modified_at: 2024-03-24 19:00:00 
excerpt: "LangChain에서 Prompt 잘림 현상 개선"
toc: true
toc_sticky: true
toc_label: "Prompt 짤림"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
---


## 배경과 목표

LangChain에서 프롬프트가 짤리는 현상 개선, [참고 POST]()

### 목표

- 현실적 방안 제시

## 현상 및 분석

### Prompt 짤림

CrewAI가 Tool을 이용해서 받은 결과를 다음 Chain으로 넘기는데 아래와 같이 짤리는 현상이 있었다.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240324175846.png)

LLM에서 Tokens의 Limit가 있는 것 같아서 이리저리 찾았는데.. LangChain은 사람들이 관심이 없는 듯하다. BingChat은 모르겠다고 Sorry라고 하더라. 에잇!

### 해소

[LangChain 공식 문서](https://api.python.langchain.com/en/latest/llms/langchain_community.llms.openai.OpenAI.html#langchain_community.llms.openai.OpenAI)에서 LLM을 생성할 때 `max_tokens` Parameter를 확인하였고 애를 늘리면 될 것 같은 느낌에 수정하였다.

```
param max_tokens: int = 256

The maximum number of tokens to generate in the completion.
-1 returns as many tokens as possible given the prompt and the models maximal context size.
```

```python
llm = OpenAI(temperature=0, streaming=True, max_tokens=-1)
```

## 시험

구동시켜보면 아래와 같이 Final Answer에 Full context가 다 들어간다.

```
Final Answer: [{'link': 'https://www.mk.co.kr/article/10973017', 'title': '"의사 먼저 복귀" 47% "정부가 양보를" 10%'}, {'link': 'https://www.mk.co.kr/article/10973016', 'title': '한동훈 "의료대란 중재 역할할 것"'}, {'link': 'https://www.mk.co.kr/article/10972978', 'title': '의대 교수들과 회동한 한동훈 의료계 "대화 움직임 긍정적"'}, {'link': 'https://www.mk.co.kr/article/10972977', 'title': '"수술한 척" 의사·환자 짬짜미 … 실손 50억 꿀꺽'}, {'link': 'https://www.mk.co.kr/article/10972979', 'title': '국민 절반 "전공의 복귀" 호소하는데 … 의대교수까지 집단 사직'}, {'link': 'https://www.mk.co.kr/article/10972941', 'title': '英 왕세자빈 "암 치료 중" 직접 공개'}, {'link': 'https://www.mk.co.kr/article/10972942', 'title': '[부음] 신만수씨 별세 외'}, {'link': 'https://www.mk.co.kr/article/10972899', 'title': '봄과 함께 찾아온 뇌염 모기'}, {'link': 'https://www.mk.co.kr/article/10972892', 'title': '울산서 크레인 무너져 바다에 추락…작업자 2명 사망'}, {'link': 'https://www.mk.co.kr/article/10972854', 'title': '김승현♥장정윤, 시험관 임신 성공 “실감 안 나… 너무 기쁘다” (‘위대한 탄생’)'}, {'link': 'https://www.mk.co.kr/article/10972835', 'title': '“삶의 질 수직상승 책임지겠다”···민주당, 총선공약집 공개'}, {'link': 'https://www.mk.co.kr/article/10972711', 'title': '대통령실 “26일 전공의 면허정지 절차대로 진행”...강경 기조 재확인'}, {'link': 'https://www.mk.co.kr/article/10969786', 'title': '하루종일 눈 알 빠질 것 같다는 이 차장, 두통까지 호소한 이유가 [생활 속 건강 Talk]'}, {'link': 'https://www.mk.co.kr/article/10972630', 'title': '친아버지가 사촌형이 된 회장님…울산 기부 ‘부자’ 가족사 [방방콕콕]'}, {'link': 'https://www.mk.co.kr/article/10972622', 'title': '업 쌓는 직업 변호사·기자, 덕 쌓는 직업 의사 [노원명 에세이]'}, {'link': 'https://www.mk.co.kr/article/10970556', 'title': '“네가 의사다” 의학계도 환호?…만병통치약으로 대접받은 이유보니 [김기정의 와인클럽]'}, {'link': 'https://www.mk.co.kr/article/10972605', 'title': '“임플란트 치료 다시 해”…치과의사 흉기 공격한 환자, 집유 감형 왜'}, {'link': 'https://www.mk.co.kr/article/10972596', 'title': '김남주, 김강우 불륜 상대=임세미 알았다 ‘충격’ (‘원더풀 월드’)'}, {'link': 'https://www.mk.co.kr/article/10972563', 'title': '“네가 옆에 있길 바랐다”… 김수현·김지원, 눈물 속 뜨거운 키스(‘눈물의 여왕’)[종합]'}]

> Finished chain.
```

개꿀!

## 결론

- LangChain에서 OpenAI LLM 생성시에는 항상 집어 넣자
- 돈 걱정하지 말자. 여차하면 GPT4 써버렷!

### Next Step

- `왜 Max tokens에 걸렸을까`를 자면서 생각해보자. 무의식의 세계야 해결해줘~!