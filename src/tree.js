import * as d3 from "d3";
import * as jsdom from "jsdom";

export function renderTreeFromConfig(data) {
    return new Promise((resolve, reject) => {
        jsdom.env({
            html: '',
            features: { QuerySelector: true },
            done: function(errors, window) {
                let root = d3.stratify()
                    .id((d) => d.Id)
                    .parentId((d) => d.Parent)
                    (data)
                    .sum((d) => d.Married ? 2 : 1)
                    .sort((a, b) => a.Order - b.Order);

                let tree = d3.tree()
                    .nodeSize([20, 120])
                    .separation((a, b) => (a.parent == b.parent ? 1 : 2) + (b.data.Married ? 1 : 0));

                tree(root);

                let body = d3.select(window.document).select('body');
                let svg = body.append('svg')
                    .attr('width', '800')
                    .attr('height', '1200');

                let g = svg.append('g')
                    .attr('transform', 'translate(40,500)');

                g.append('text')
                    .attr('dy', 540)
                    .attr('dx', 20)
                    .style('font-size', 12)
                    .text('※ 安徽巢湖五分洪洪氏字辈：允恭克让 世德作求 伦理益景 家道来昌');

                let link = g.selectAll('.link')
                    .data(root.descendants().slice(1))
                    .enter()
                    .append('path')
                    .attr('class', 'link')
                    .attr('d', (d) =>
                        'M' + d.y + ',' + d.x
                            + 'C' + (d.y + d.parent.y + 60) / 2 + ',' + d.x
                            + ' ' + (d.y + d.parent.y + 60) / 2 + ',' + d.parent.x
                            + ' ' + (d.parent.y + 60) + ',' + d.parent.x
                    );

                let node = g.selectAll('.node')
                    .data(root.descendants())
                    .enter()
                    .append('g')
                    .attr('transform',(d) => 'translate(' + d.y + ',' + d.x + ')');

                node.append('text')
                    .attr('dy', 3)
                    .attr('x', 8)
                    .style('text-anchor', 'start')
                    .text((d) => d.data.Name);

                node
                    .filter((d,i) => d.depth > 0 && d.data.Married)
                    .append('text')
                    .attr('dy', 23)
                    .attr('x', 8)
                    .text(function(d) {
                        if (d.data.Spouse)
                          return '(' + d.data.Spouse + ')';
                        return '(？？？)';
                    });

                node
                .filter((d,i) => d.data.Note)
                .append('text')
                .attr('dy', 46)
                .attr('x', 8)
                .style('font-size', 12)
                .text((d) => d.data.Note);

                resolve(body.html());
            }
        });
    });
}
