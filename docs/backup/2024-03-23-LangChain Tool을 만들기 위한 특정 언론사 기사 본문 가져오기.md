---
excerpt: "News 기사 본문을 가지고 오는 애를 만들어보자. "
toc: true
toc_sticky: true
toc_label: "CrewAI Agent 생성하기"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
---

## 배경과 목표

LangChain으로 News를 긁어 올껀데, 본문만 가지고 오기 힘듬 [이전이야기](https://mewithai.github.io/langchain/Naver-News-%ED%81%B4%EB%A1%A4%EB%A7%81-Agent%EC%9D%98-%EB%AC%B8%EC%A0%9C%EC%A0%90/)

나와 비슷한 고민을 한분이 4년전에 계셨다. [참고Site](https://everyday-tech.tistory.com/entry/3%ED%83%84-%EC%89%BD%EA%B2%8C-%EB%94%B0%EB%9D%BC%ED%95%98%EB%8A%94-%EB%84%A4%EC%9D%B4%EB%B2%84-%EB%89%B4%EC%8A%A4-%ED%81%AC%EB%A1%A4%EB%A7%81-%EB%B3%B8%EB%AC%B8-%EA%B0%80%EC%A0%B8%EC%98%A4%EA%B8%B0)

목표 : 특정 언로사의 기사만 가지고 와보자

## 분석

### 네이버에서 특정 언론사 검색

- 네이버의 다음의 URL을 넣으니까 특정 언론사별로 News를 검색할 수 있었다.
  - `https://search.naver.com/search.naver?ssc=tab.news.all&where=news&sm=tab_jum&query=%EC%BD%94%EB%A1%9C%EB%82%98&nso=so%3Add%2Cp%3A1d`
- GET 파라미터를 봐도 잘 모르겠지만 다음은 `매일경제`를 검색하는 URL이다.
  - [접속해봐도 좋다. URL](https://search.naver.com/search.naver?where=news&query=%EB%B3%91%EC%9B%90&sm=tab_opt&sort=1&photo=0&field=0&pd=4&ds=2024.03.22.22.41&de=2024.03.23.22.41&docid=&related=0&mynews=1&office_type=1&office_section_code=3&news_office_checked=1009&nso=so%3Add%2Cp%3A1d&is_sug_officeid=0&office_category=0&service_area=1)
- 쉽게 유추가능한 파라미터는 다음과 같다.
  - 시작날짜: ds=2024.03.22.22.33  
  - 종료날짜: de=2024.03.23.22.33
  - 검색어: query=%EB%B3%91%EC%9B%90
  - 최신순: sort=1
  - 나머지는 그냥 쓰자

### 매일경제 본문을 가지고 오기

- 매일경제에서는 `class='news_cnt_detail_wrap' itemprop='articleBody'`이 뉴스의 본문이다.
- 가지고 오는 애는 ChatGPT에서 짜달라고 했다. [여기참고](https://wikidocs.net/231644)

```python
    def ReadNews(self, url):

        loader = WebBaseLoader(
            web_paths=([url]),
            bs_kwargs=dict(
                parse_only=bs4.SoupStrainer(
                    class_=("news_cnt_detail_wrap")
                )
            ),
        )
        contents  = loader.load()

        # 각 Chunk 단위의 템플릿
        template = '''Summarize the following in Korean

        {text}
        '''

        # 전체 문서(혹은 전체 Chunk)에 대한 지시(instruct) 정의
        combine_template = '''{text}

        The results of the summary should be in the following format in korean
        Title: The title of the newspaper article
        Key points: a one-line summary of the article
        Content: bulleted points of the main points.
        '''

        # 템플릿 생성
        prompt = PromptTemplate(template=template, input_variables=['text'])
        combine_prompt = PromptTemplate(template=combine_template, input_variables=['text'])

        # 요약을 도와주는 load_summarize_chain
        chain = load_summarize_chain(self.llmLC, 
                             map_prompt=prompt, 
                             combine_prompt=combine_prompt, 
                             chain_type="map_reduce", 
                             verbose=False)

        chain.invoke(contents)
```

- `WebBaseLoader`에서 `bs_kwargs`를 사용하는 것이 특이하다. 차후 공부가 더 필요하다.

### 실행 결과

시험 URL은 다음과 같다 : [다음](https://www.mk.co.kr/news/business/10862989)

News의 내용은 다음과 같다. 본문만 잘 가지고 온다.

```
\n 대구 수송기기·기계소재부품 AI융합 지원 효과육안 검사로 판별이 힘든 품질불량 원인 파악, 불량 예측과 공정 개선시트 송풍장치인 SHVU 생산라인에 적용        사진 확대    빅웨이브에이아이가 자체 개발한 분석 솔루션 ‘BADA(BigwaveAI Data Analytics)’  제공=빅웨이브에이아이  대구의 인공지능(AI) 스타트업이 지역특화산업인 자동차부품 분야에서 두각을 나타내 화제가 되고 있다.과학기술정보통신부와 정보통신산업진흥원(NIPA)이 지난해부터 추진하고 있는 ‘AI융합 지역특화산업 지원사업’에서 대구테크노파크가 주관하는 대구 수송기기·기계소재부품 분야 공급업체로 참여하고 있는 빅웨이브에이아이(대표 이희준)는 KBI메탈·상신브레이크 등 지역을 대표하는 자동차부품 기업에 AI솔루션을 공급하는 개가를 올렸다.출범 3년차에 불과한 빅웨이브에이아이가 개발한 솔루션은 육안이나 기존 규칙기반 검사로 판별이 힘든 자동차부품의 품질불량 원인과 검사결과를 AI가 예측해 불량의 원인을 파악하고, 공정을 개선할 수 있도록 해준다.이 솔루션은 KBI메탈 전장사업부에서 생산하는 자동차 부품인 통풍시트 공조장치를 통해 운전석에 바람이 나오도록 하는 송풍장치인 SHVU(Seat Heating Ventilation Unit) 라인에 적용된다.빅웨이브는 사업 1차연도인 작년에는 자동화된 설비에서 생산되는 제품에 대한 불량 예측 딥러닝 모델링과 예측 API 개발에 주력했고, 2차연도인 올해에는 생산된 제품에 대해 진행하는 이음검사를 예측할 수 있는 AI 모델을 개발하고, 검사의 정확도를 높여가며 현장에서 생산성을 높이는데 주력했다.이에 따라 데이터를 분석한 후 예측되는 제품의 양·불과 실제를 비교해 정확도를 산출하는 ‘생산결과 양·불 예측율’이 98%, 제품 생산 후 수행하는 이음검사 결과 양·불 여부를 예측해 실제와 정확도를 비교하는 ‘검사결과 양·불 예측율’은 97%에 달했으며, 최종판정 예측률도 1차연도 95%에서 2차연도 98%로 높아졌다. 또, 공정불량률은 21% 감소했고, 시간당 생산량이 5.2% 증가했다. 제조원가의 1.8% 개선됐다이와 함께 빅웨이브에이아이는 상신브레이크㈜ 브레이크패드의 제조와 생산을 지능화한 AI시스템도 개발했다.브레이크패드의 핵심부품인 마찰재는 성능에 따라 조합과 배합비율이 달라 연구·분석에 상당한 시간이 소모된다. 그동안 쌓인 데이터를 분석해 지능화하면 제품품질 개선이 가능하고, 배합설계에 들어가는 자원도 최소화할 수 있다. 특히 그동안의 수주데이터를 분석해서 미래 수요를 예측할 수 있다면 재고관리의 편의성과 비용절감 효과를 동시에 누릴 수 있다.빅웨이브에이아이의 AI시스템은 제품개발 과정에서 원재료의 배합비율과 제작공정 등을 학습, 브레이크 마찰재의 물성을 예측해준다. AI가 배합결과물의 성능을 시뮬레이션해 가장 적은 비용과 가장 최적화된 성능을 기준으로 배합설계를 추천해준다. 또 기존 데이터로 구축된 데이터베이스(DB)를 학습해 생산공정에서 수주와 UPH(Unit Per Hour)를 예측해준다. 재고관리에 따른 각종 비용을 절감할 수 있고, 장기재고를 줄여 최신 제품을 고객에게 전달할 수 있는 등 공급망 관리의 효율성 확보할 수 있는 것이다.이희준 빅웨이브에이아이 대표는 “제조 공정에 AI를 도입하면 공정 불량률을 감소시키고, 생산량을 증대시킬 수 있다”면서 “비전문가도 쉽게 데이터 분석을 통해 성과를 낼 수 있도록 솔루션을 개발해 다양한 분야에 적용할 수 있도록 할 계획”이라고 말했다.▣ 업체 소개빅웨이브AI는 빅데이터와 AI분석 소프트웨어 전문업체로 2020년 창립됐다. 이 회사는 법인 설립 이전부터 한국가스공사·유한킴벌리·삼성전자·LGU+ 등 다양한 데이터 분석 프로젝트를 함께한 팀원들이 모여 출범한 특징이 있다. 주어진 문제에 맞는 최적의 AI모델을 직접 설계해 개발하는 기술기업이다.      사진 확대    자동차부품의 품질검사 결과를 예측해 불량의 원인을 파악하고 공정을 개선해주는 AI솔루션을 개발한 빅웨이브에이아이. 사진제공=빅웨이브에이아이  \n
```

- 실행해서 최종 결과 원본

```
{'input_documents': [Document(page_content='\n 대구 수송기기·기계소재부품 AI융합 지원 효과육안 검사로 판별이 힘든 품질불량 원인 파악, 불량 예측과 공...s://www.mk.co.kr/news/business/10862989'})], 'output_text': 'Title: 대구 수송기기·기계소재부품 분야 AI 스타트업, 품질불량 예측 솔루션 개발\n\nKey points: 빅웨이브에이아이가 자동차부품의 품질불량을 ... 제조원가 개선을 위해 노력 중\n- 대구의 AI 스타트업으로 주목받고 있음.'}
```

- 결과요약
  - Title: 대구 수송기기·기계소재부품 분야 AI 스타트업, 품질불량 예측 솔루션 개발
  - Key points: 빅웨이브에이아이가 자동차부품의 품질불량을 ... 제조원가 개선을 위해 노력 중
    - 대구의 AI 스타트업으로 주목받고 있음.
  
## 결론 및 Next Step

쓸만하네.

### Next Step

- Naver 특정 언론사 검색에서 List를 얻자
- LangChain의 Tool로 만들자.
