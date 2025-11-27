import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
// import { Product } from 'src/products/entities';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    await this.deleteTable();
    const adminUser = await this.insertUsers();
    await this.insertNewProducts(adminUser);
    return `SEED EXECUTED`;
  }

  private async deleteTable() {
    await this.productsService.deleteAllProducts();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];

    seedUsers.forEach((user) => {
      users.push(this.userRepository.create(user));
    });

    const dbUsers = await this.userRepository.save(seedUsers);
    return dbUsers[0];
  }

  private async insertNewProducts(user: User) {
    await this.productsService.deleteAllProducts();

    const products = initialData.products;

    // const insertPromise: Promise<Product>[] = [];
    const insertPromise: Promise<any>[] = [];

    products.forEach((product) => {
      insertPromise.push(
        this.productsService.create(product, user),
        // this.productsService.create(product) as Promise<Product>,
      );
    });

    await Promise.all(insertPromise);

    return true;
  }
}
