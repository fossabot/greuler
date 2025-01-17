import { select, selection } from 'd3-selection'
import extend from 'extend'

import { ElementSelector } from './Graph'

const HIGHLIGHT = 'highlight'

export class GreulerDefaultTransition extends ElementSelector {
  /**
   * Gets all the edges of the graph
   *
   * @returns {selection}
   */
  getEdges() {
    return this.innerEdgeSelector(this.select(this.graph.edges))
  }

  /**
   * Gets all the nodes of the graph
   *
   * @returns {selection}
   */
  getNodes() {
    return this.innerNodeSelector(this.select(this.graph.nodes))
  }

  /**
   * Highlights a node temporarily, it consists of two
   * chained transitions
   *
   * - increase the radius to 1.5x the original `r` value
   * - decrease the radius to the original `r` value
   *
   * @param {selection} selection
   * @param {Object} options
   * @returns {Promise<selection>}
   */
  doTemporalHighlightNode(selection, options) {
    return this.innerNodeSelector(selection)
      .transition(HIGHLIGHT)
      .duration(this.getAnimationTime() / 2)
      .attr('r', (d) => options.r || d.r * 1.5)
      .transition(HIGHLIGHT)
      .duration(this.getAnimationTime() / 2)
      .attr('r', (d) => d.r)
      .end()
  }

  /**
   * Highlights an edge temporarily, it consists of two
   * chained transitions
   *
   * - change the stroke of the `path` that represents the edge to
   * `options.stroke`
   * - change the stroke to the original value
   *
   * @param {selection} selection
   * @param {Object} options
   * @returns {Promise<selection>}
   */
  doTemporalHighlightEdges(selection, options) {
    return this.innerEdgeSelector(selection)
      .transition(HIGHLIGHT)
      .duration(this.getAnimationTime() / 2)
      .attr('stroke', options.stroke)
      .transition(HIGHLIGHT)
      .duration(this.getAnimationTime() / 2)
      .attr('stroke', (d) => d.stroke)
      .end()
  }

  /**
   * Edge traversal animation, it animates a hidden path giving the impression
   * of movement, if source is given then it will always start the animation
   * from the node `source` even if the edge is an incoming edge
   *
   * @param {selection} selection
   * @param {config} options
   * @param {number} [source=-1]
   * @returns {Promise<selection>}
   */
  async traverseEdgeWithDirection(selection, options, source = -1) {
    const paths = selection.selectAll('path.traversal')
    await paths
      .each(function () {
        const el = select(this)
        const l = this.getTotalLength()
        el.attr('stroke', options.stroke)
          .attr('stroke-dasharray', `${l} ${l}`)
          .attr('stroke-dashoffset', l)
          .attr('opacity', 1)
      })
      .transition('dasharray')
      .duration(options.duration)
      .attr('stroke-dashoffset', function (d) {
        const length = this.getTotalLength()
        const twiceLength = length * 2
        let lengthToMove = 0
        if (source !== -1) {
          if (d.target.id === source) {
            lengthToMove = twiceLength
          }
        }

        if (options.reverse) {
          lengthToMove = twiceLength - lengthToMove
        }

        return lengthToMove
      })
      .attr('opacity', 0)
      .end()

    paths.each(function () {
      const el = select(this)
      el.attr('stroke-dasharray', null).attr('stroke-dashoffset', null).attr('opacity', 0)
    })

    return paths
  }

  async traverseEdges(selection, options, source) {
    options = extend(
      {
        keepStroke: true,
        reverse: false
      },
      this.getStyleOptions(),
      options
    )

    selection.call(this.traverseEdgeWithDirection, options, source)
    if (options.keepStroke) {
      await this.innerEdgeSelector(selection)
        .transition('update')
        .duration(options.duration)
        .attr('stroke', options.stroke)
        .end()
    }
    return this.innerEdgeSelector(selection)
  }

  getNode(node) {
    return this.innerNodeSelector(this.select(this.graph.getNode(node)))
  }

  getEdge(edge) {
    return this.innerEdgeSelector(this.select(this.graph.getEdge(edge)))
  }

  // temporal highlight

  highlightNode(node, options) {
    return this.doTemporalHighlightNode(this.select(this.graph.getNode(node)), this.getStyleOptions(options))
  }

  highlightEdge(edge, options) {
    return this.doTemporalHighlightEdges(this.select(this.graph.getEdge(edge)), this.getStyleOptions(options))
  }

  highlightIncidentEdges(node, options) {
    return this.doTemporalHighlightEdges(this.select(this.graph.getIncidentEdges(node)), this.getStyleOptions(options))
  }

  highlightOutgoingEdges(node, options) {
    return this.doTemporalHighlightEdges(this.select(this.graph.getOutgoingEdges(node)), this.getStyleOptions(options))
  }

  highlightIncomingEdges(node, options) {
    return this.doTemporalHighlightEdges(this.select(this.graph.getIncomingEdges(node)), this.getStyleOptions(options))
  }

  // traversal of an edge given a node

  traverseOutgoingEdges(node, options) {
    return this.traverseEdges(this.select(this.graph.getOutgoingEdges(node)), this.getStyleOptions(options))
  }

  traverseIncomingEdges(node, options) {
    return this.traverseEdges(this.select(this.graph.getIncomingEdges(node)), this.getStyleOptions(options))
  }

  traverseIncidentEdges(node, options) {
    return this.traverseEdges(this.select(this.graph.getIncidentEdges(node)), this.getStyleOptions(options))
  }

  // traversal of an edge between two nodes

  traverseEdgesBetween(edge, options) {
    return this.traverseEdges(this.select(this.graph.getEdgesBetween(edge)), this.getStyleOptions(options), edge.source)
  }

  traverseAllEdgesBetween(edge, options) {
    return this.traverseEdges(
      this.select(this.graph.getAllEdgesBetween(edge)),
      this.getStyleOptions(options),
      edge.source
    )
  }
}
