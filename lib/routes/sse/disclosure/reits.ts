// SSE REITs disclosure route: 公募REITs信息披露 (Shanghai Stock Exchange)
import type { Context } from 'hono';

import type { Data, DataItem, Language, Route } from '@/types';
import { ViewType } from '@/types';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';

export const handler = async (ctx: Context): Promise<Data> => {
    const limit = ctx.req.query('limit') ?? '50';

    const pageUrl = 'https://www.sse.com.cn/reits/';
    const pdfHost = 'https://www.sse.com.cn';

    const start = new Date(Date.now() - 183 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const response = await got('https://query.sse.com.cn/commonSoaQuery.do', {
        searchParams: {
            sqlId: 'REITS_BULLETIN',
            isPagination: 'true',
            fundCode: '',
            startDate: start,
            endDate: end,
            'pageHelp.pageSize': limit,
            'pageHelp.pageNo': '1',
            'pageHelp.beginPage': '1',
            'pageHelp.endPage': '5',
            'pageHelp.cacheSize': '1',
        },
        headers: {
            Referer: pageUrl,
        },
    });

    const language = 'zh-CN' as Language;

    const items: DataItem[] = response.data.pageHelp.data.map((item): DataItem => {
        const pdfUrl = new URL(item.url, pdfHost).href;
        return {
            title: item.title,
            description: `<p><strong>${item.fundExtAbbr || item.fundAbbr}</strong>（${item.securityCode}）</p><table><tbody><tr><td>公告类型</td><td>${item.bulletinType}</td></tr><tr><td>公告日期</td><td>${item.sseDate}</td></tr><tr><td>所属年度</td><td>${item.bulletinYear}</td></tr></tbody></table><p>📄 <a href="${pdfUrl}">查看公告原文（PDF）</a></p>`,
            pubDate: parseDate(item.sseDate),
            link: pdfUrl,
            category: [item.securityCode, item.fundExtAbbr || item.fundAbbr, item.bulletinType],
            guid: `sse-reits-${item.url}`,
            id: `sse-reits-${item.url}`,
            updated: parseDate(item.sseDate),
            enclosure_url: pdfUrl,
            enclosure_type: 'application/pdf',
            enclosure_title: item.title,
            language,
        };
    });

    return {
        title: '上海证券交易所 - 公募REITs信息披露',
        description: '上海证券交易所公募REITs信息披露公告',
        link: pageUrl,
        item: items,
        allowEmpty: true,
        language,
        id: pageUrl,
    };
};

export const route: Route = {
    path: '/disclosure/reits',
    name: '公募REITs信息披露',
    url: 'www.sse.com.cn/reits',
    maintainers: ['weixshaw'],
    handler,
    example: '/sse/disclosure/reits',
    parameters: undefined,
    description: undefined,
    categories: ['finance'],
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportRadar: true,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['www.sse.com.cn/reits'],
            target: '/disclosure/reits',
        },
    ],
    view: ViewType.Articles,
};
