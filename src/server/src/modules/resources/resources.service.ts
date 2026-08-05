// 资源服务：资源 CRUD、公开列表/详情、下载计数
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { ResourceStatus } from '../../common/enums/status.enum';
import { renderMarkdown } from '../../common/utils/markdown';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger('ResourcesService');

  constructor(private prisma: PrismaService) {}

  // 公开列表（仅已发布）
  async findAll() {
    const list = await this.prisma.resource.findMany({
      where: { status: ResourceStatus.PUBLISHED },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    return list.map((r) => this.toListVo(r));
  }

  // 公开详情
  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: BigInt(id) },
    });
    if (!resource || resource.status !== ResourceStatus.PUBLISHED) {
      throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
    }
    return this.toDetailVo(resource);
  }

  // 记录下载次数
  async recordDownload(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: BigInt(id) },
    });
    if (!resource || resource.status !== ResourceStatus.PUBLISHED) {
      throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
    }
    await this.prisma.resource.update({
      where: { id: BigInt(id) },
      data: { downloadCount: { increment: 1 } },
    });
    return {
      downloadUrl: resource.downloadUrl,
      extractionCode: resource.extractionCode,
      panType: resource.panType,
    };
  }

  // 管理员：列表（含全部状态）
  async adminFindAll() {
    const list = await this.prisma.resource.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    return list.map((r) => this.toAdminListVo(r));
  }

  // 管理员：创建
  async create(dto: CreateResourceDto) {
    const contentHtml = dto.content ? renderMarkdown(dto.content) : null;
    const resource = await this.prisma.resource.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        coverImage: dto.coverImage || null,
        downloadUrl: dto.downloadUrl,
        extractionCode: dto.extractionCode || null,
        panType: dto.panType || 'baidu',
        content: dto.content || null,
        contentHtml,
        sort: dto.sort ?? 0,
        status: dto.status || ResourceStatus.PUBLISHED,
      },
    });
    return this.toDetailVo(resource);
  }

  // 管理员：更新
  async update(id: string, dto: UpdateResourceDto) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: BigInt(id) },
    });
    if (!resource) {
      throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.downloadUrl !== undefined) data.downloadUrl = dto.downloadUrl;
    if (dto.extractionCode !== undefined) data.extractionCode = dto.extractionCode;
    if (dto.panType !== undefined) data.panType = dto.panType;
    if (dto.content !== undefined) {
      data.content = dto.content;
      data.contentHtml = dto.content ? renderMarkdown(dto.content) : null;
    }
    if (dto.sort !== undefined) data.sort = dto.sort;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.resource.update({
      where: { id: BigInt(id) },
      data,
    });
    return this.toDetailVo(updated);
  }

  // 管理员：删除
  async remove(id: string) {
    await this.prisma.resource.delete({ where: { id: BigInt(id) } });
  }

  // 列表 VO（不含下载地址，列表页只展示信息）
  private toListVo(r: any) {
    return {
      id: Number(r.id),
      title: r.title,
      description: r.description,
      coverImage: r.coverImage,
      panType: r.panType,
      downloadCount: Number(r.downloadCount),
      createdAt: r.createdAt.toISOString(),
    };
  }

  // 详情 VO（含下载地址与正文）
  private toDetailVo(r: any) {
    return {
      id: Number(r.id),
      title: r.title,
      description: r.description,
      coverImage: r.coverImage,
      downloadUrl: r.downloadUrl,
      extractionCode: r.extractionCode,
      panType: r.panType,
      content: r.content,
      contentHtml: r.contentHtml,
      downloadCount: Number(r.downloadCount),
      sort: r.sort,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  // 管理员列表 VO
  private toAdminListVo(r: any) {
    return {
      ...this.toListVo(r),
      downloadUrl: r.downloadUrl,
      extractionCode: r.extractionCode,
      sort: r.sort,
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
